package com.dmt.toeicapp.common.aop;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.AfterThrowing;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.util.Iterator;
import java.util.Map;
import java.util.Set;

@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class LoggingAspect {

    private final ObjectMapper objectMapper;

    /**
     * [SECURITY] Danh sách tên field nhạy cảm cần che khi ghi log.
     * So sánh dạng lowercase để bắt tất cả biến thể: password, Password, PASSWORD.
     * Thêm vào đây nếu có field mới cần ẩn.
     */
    private static final Set<String> SENSITIVE_FIELDS = Set.of(
            "password", "passwordhash", "oldpassword", "newpassword",
            "otp", "token", "refreshtoken", "idtoken", "accesstoken",
            "secret", "apikey", "credentials"
    );

    private static final String MASKED = "***";

    // Pointcut — áp dụng cho toàn bộ service layer
    @Pointcut("execution(* com.dmt.toeicapp..service..*(..))")
    public void serviceLayer() {}

    // Log tên method + arguments (đã mask) khi vào + thời gian thực thi khi ra
    @Around("serviceLayer()")
    public Object logAround(ProceedingJoinPoint jp) throws Throwable {
        String className  = jp.getSignature().getDeclaringType().getSimpleName();
        String methodName = jp.getSignature().getName();

        // Chỉ log args khi DEBUG enabled — tránh overhead serialize khi không cần
        if (log.isDebugEnabled()) {
            log.debug("→ {}.{}() args: {}", className, methodName, sanitizeArgs(jp.getArgs()));
        }

        long   start   = System.currentTimeMillis();
        Object result  = jp.proceed();
        long   elapsed = System.currentTimeMillis() - start;

        log.debug("← {}.{}() completed in {}ms", className, methodName, elapsed);
        return result;
    }

    // Log riêng khi có exception — giúp debug dễ hơn
    @AfterThrowing(pointcut = "serviceLayer()", throwing = "ex")
    public void logException(JoinPoint jp, Throwable ex) {
        String className  = jp.getSignature().getDeclaringType().getSimpleName();
        String methodName = jp.getSignature().getName();

        log.error("✗ {}.{}() threw: {} — {}",
                className, methodName,
                ex.getClass().getSimpleName(), ex.getMessage());
    }

    // ── Private helpers ───────────────────────────────────────

    /**
     * Serialize toàn bộ danh sách arguments thành chuỗi an toàn để log.
     * Mỗi argument được xử lý riêng bởi sanitizeArg().
     */
    private String sanitizeArgs(Object[] args) {
        if (args == null || args.length == 0) return "[]";

        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < args.length; i++) {
            if (i > 0) sb.append(", ");
            sb.append(sanitizeArg(args[i]));
        }
        sb.append("]");
        return sb.toString();
    }

    /**
     * Xử lý một argument:
     * - null / primitive / String → giữ nguyên (an toàn)
     * - MultipartFile → chỉ log tên file (không serialize binary)
     * - Object phức tạp → serialize JSON rồi mask field nhạy cảm
     */
    private String sanitizeArg(Object arg) {
        if (arg == null) return "null";

        // Binary data — không serialize, chỉ log metadata
        if (arg instanceof MultipartFile file) {
            return "MultipartFile[name=" + file.getOriginalFilename()
                    + ", size=" + file.getSize() + "bytes]";
        }

        // Primitive wrappers và String — an toàn, không chứa structure
        if (arg instanceof Number || arg instanceof Boolean
                || arg instanceof Character || arg instanceof String) {
            return String.valueOf(arg);
        }

        // Object phức tạp: serialize rồi mask
        try {
            JsonNode node = objectMapper.valueToTree(arg);
            if (node.isObject()) {
                maskSensitiveFields((ObjectNode) node);
            }
            return objectMapper.writeValueAsString(node);
        } catch (Exception e) {
            // Fallback an toàn: chỉ in tên class
            return arg.getClass().getSimpleName() + "[unserializable]";
        }
    }

    /**
     * Duyệt toàn bộ field của ObjectNode.
     * Nếu tên field (lowercase) nằm trong SENSITIVE_FIELDS → thay value bằng "***".
     * Hỗ trợ cả nested object (đệ quy).
     */
    private void maskSensitiveFields(ObjectNode node) {
        Iterator<Map.Entry<String, JsonNode>> fields = node.fields();
        while (fields.hasNext()) {
            Map.Entry<String, JsonNode> entry = fields.next();
            String fieldNameLower = entry.getKey().toLowerCase();

            boolean isSensitive = SENSITIVE_FIELDS.stream()
                    .anyMatch(fieldNameLower::contains);

            if (isSensitive) {
                node.put(entry.getKey(), MASKED);
            } else if (entry.getValue().isObject()) {
                // Đệ quy cho nested object
                maskSensitiveFields((ObjectNode) entry.getValue());
            }
        }
    }
}