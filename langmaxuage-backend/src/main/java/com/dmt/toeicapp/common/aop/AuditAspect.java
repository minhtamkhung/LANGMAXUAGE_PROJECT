package com.dmt.toeicapp.common.aop;

import com.dmt.toeicapp.common.audit.AuditLog;
import com.dmt.toeicapp.common.audit.AuditLogRepository;
import com.dmt.toeicapp.common.security.SecurityUtils;
import com.dmt.toeicapp.user.entity.User;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.List;

@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class AuditAspect {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper       objectMapper;

    /**
     * [SECURITY] Danh sách IP của reverse proxy tin cậy (nginx, load balancer).
     * Chỉ chấp nhận header X-Forwarded-For khi request đến từ một trong các IP này.
     * Nếu để trống (mặc định): bỏ qua X-Forwarded-For hoàn toàn, dùng remoteAddr.
     * Ví dụ: TRUSTED_PROXIES=172.18.0.2,10.0.0.1
     */
    @Value("${app.security.trusted-proxies:}")
    private String trustedProxiesRaw;

    // Chỉ chạy khi method có @Auditable VÀ thành công (AfterReturning)
    // Nếu method throw exception → không ghi audit (dữ liệu chưa thay đổi)
    @AfterReturning(
            pointcut = "@annotation(com.dmt.toeicapp.common.aop.Auditable)",
            returning = "returnValue"
    )
    public void audit(JoinPoint jp, Object returnValue) {
        try {
            MethodSignature signature = (MethodSignature) jp.getSignature();
            Method          method    = signature.getMethod();
            Auditable       auditable = method.getAnnotation(Auditable.class);

            User   currentUser = getCurrentUserSafely();
            String ipAddress   = getClientIp();

            // Serialize return value thành JSON để lưu làm new_value
            String newValue = serializeSafely(returnValue);

            AuditLog auditLog = AuditLog.builder()
                    .user(currentUser)
                    .action(auditable.action())
                    .entityType(auditable.entity())
                    .entityId(extractEntityId(returnValue, jp.getArgs()))
                    .newValue(newValue)
                    .ipAddress(ipAddress)
                    .build();

            auditLogRepository.save(auditLog);

            log.debug("Audit ghi nhận: action={}, entity={}, user={}, ip={}",
                    auditable.action(), auditable.entity(),
                    currentUser != null ? currentUser.getId() : "system",
                    ipAddress);

        } catch (Exception e) {
            // Audit không được làm crash business logic
            log.warn("AuditAspect ghi log thất bại: {}", e.getMessage());
        }
    }

    // ── Private helpers ───────────────────────────────────────

    // Lấy user hiện tại — null nếu là system action (không có auth)
    private User getCurrentUserSafely() {
        try {
            return SecurityUtils.getCurrentUser();
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * [SECURITY] Lấy IP thực của client, có kiểm tra trusted proxy.
     *
     * Logic:
     *   - Nếu request đến từ IP nằm trong danh sách trusted-proxies
     *     → tin tưởng X-Forwarded-For header (lấy IP đầu tiên trong chuỗi)
     *   - Nếu không nằm trong danh sách (hoặc trusted-proxies không được cấu hình)
     *     → dùng remoteAddr trực tiếp, BỎ QUA X-Forwarded-For để tránh giả mạo IP
     *
     * Tại sao quan trọng:
     *   Bất kỳ client nào cũng có thể tự set header "X-Forwarded-For: 1.2.3.4".
     *   Nếu tin vô điều kiện, hacker có thể ghi audit log với IP giả → mất dấu vết.
     */
    private String getClientIp() {
        try {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs == null) return null;

            HttpServletRequest request    = attrs.getRequest();
            String             remoteAddr = request.getRemoteAddr();

            // Chỉ chấp nhận X-Forwarded-For nếu request đến từ trusted proxy
            if (isTrustedProxy(remoteAddr)) {
                String forwarded = request.getHeader("X-Forwarded-For");
                if (forwarded != null && !forwarded.isBlank()) {
                    // X-Forwarded-For có thể có nhiều IP: "client, proxy1, proxy2"
                    // IP đầu tiên là IP thực của client
                    return forwarded.split(",")[0].trim();
                }
            }

            // Fallback: remoteAddr trực tiếp (an toàn, không thể giả mạo)
            return remoteAddr;

        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Kiểm tra xem remoteAddr có nằm trong danh sách trusted proxy không.
     * trustedProxiesRaw đọc từ ${app.security.trusted-proxies}.
     * Nếu property trống → không có proxy nào được tin tưởng.
     */
    private boolean isTrustedProxy(String remoteAddr) {
        if (trustedProxiesRaw == null || trustedProxiesRaw.isBlank()) {
            return false;
        }
        List<String> trustedList = Arrays.stream(trustedProxiesRaw.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
        return trustedList.contains(remoteAddr);
    }

    // Serialize object thành JSON string — null nếu không serialize được
    private String serializeSafely(Object obj) {
        if (obj == null) return null;
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return obj.toString();
        }
    }

    // Lấy entity id từ return value hoặc từ args
    // Ưu tiên return value nếu có getId() (CREATE/UPDATE trả về DTO có id)
    // DELETE thường trả về void nên lấy từ args[0]
    private Long extractEntityId(Object returnValue, Object[] args) {
        if (returnValue != null) {
            try {
                Method getId = returnValue.getClass().getMethod("id");
                Object id    = getId.invoke(returnValue);
                if (id instanceof Long) return (Long) id;
            } catch (Exception ignored) {}

            try {
                Method getId = returnValue.getClass().getMethod("getId");
                Object id    = getId.invoke(returnValue);
                if (id instanceof Long) return (Long) id;
            } catch (Exception ignored) {}
        }

        // Fallback: lấy args[0] nếu là Long (thường là id parameter)
        if (args != null && args.length > 0 && args[0] instanceof Long) {
            return (Long) args[0];
        }

        return null;
    }
}