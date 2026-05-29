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
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.lang.reflect.Method;

@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class AuditAspect {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper       objectMapper;

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

            log.debug("Audit ghi nhận: action={}, entity={}, user={}",
                    auditable.action(), auditable.entity(),
                    currentUser != null ? currentUser.getId() : "system");

        } catch (Exception e) {
            // Audit không được làm crash business logic
            // Log lỗi rồi bỏ qua — không re-throw
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

    // Lấy IP từ request — hỗ trợ cả reverse proxy (X-Forwarded-For)
    private String getClientIp() {
        try {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs == null) return null;

            HttpServletRequest request = attrs.getRequest();
            String forwarded = request.getHeader("X-Forwarded-For");
            if (forwarded != null && !forwarded.isBlank()) {
                return forwarded.split(",")[0].trim();
            }
            return request.getRemoteAddr();
        } catch (Exception e) {
            return null;
        }
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
        // Thử lấy id từ return value trước
        if (returnValue != null) {
            try {
                Method getId = returnValue.getClass().getMethod("id");
                Object id = getId.invoke(returnValue);
                if (id instanceof Long) return (Long) id;
            } catch (Exception ignored) {}

            // Thử getters dạng getId()
            try {
                Method getId = returnValue.getClass().getMethod("getId");
                Object id = getId.invoke(returnValue);
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