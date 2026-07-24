package com.dmt.toeicapp.common.security;

import com.dmt.toeicapp.common.exception.AppException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.Duration;

/**
 * AOP Aspect xử lý Rate Limiting dựa trên Custom Annotation @RateLimit.
 * Khóa theo IP, User ID hoặc kết hợp cả hai.
 *
 * <p><b>Storage backend: Redis</b> — hoạt động đúng khi scale-out nhiều instance.
 *
 * <p><b>Thuật toán: Fixed Window Counter</b><br>
 * Mỗi (method + keyType) được lưu thành 1 Redis key với TTL = durationSeconds.<br>
 * Redis {@code INCR} là atomic → không race condition dù nhiều pod chạy song song.
 *
 * <p><b>Fallback:</b> Nếu Redis không khả dụng → log WARN + cho phép request đi qua.
 * Ưu tiên availability hơn strict rate limiting khi infra gặp vấn đề.
 */
@Aspect
@Component
@Slf4j
@RequiredArgsConstructor
public class RateLimitingAspect {

    /** Prefix namespace trong Redis để tránh xung đột với key khác. */
    private static final String KEY_PREFIX = "rate_limit:";

    private final StringRedisTemplate redisTemplate;

    @Around("@annotation(rateLimit)")
    public Object enforceRateLimit(ProceedingJoinPoint joinPoint, RateLimit rateLimit) throws Throwable {
        HttpServletRequest request = getHttpServletRequest();
        String clientIp    = extractClientIp(request);
        Long   currentUserId = getCurrentUserIdSafely();

        String redisKey = buildRedisKey(joinPoint, rateLimit, clientIp, currentUserId);

        try {
            // INCR là atomic — an toàn với nhiều instance đồng thời
            Long currentCount = redisTemplate.opsForValue().increment(redisKey);

            if (currentCount == null) {
                // Redis trả về null bất thường → cho qua, log warn
                log.warn("Redis INCR trả về null cho key '{}', bỏ qua rate limit check.", redisKey);
                return joinPoint.proceed();
            }

            if (currentCount == 1L) {
                // Key vừa được tạo (lần đầu trong window) → set TTL
                // Chỉ set TTL một lần duy nhất để tránh reset window mỗi request
                redisTemplate.expire(redisKey, Duration.ofSeconds(rateLimit.durationSeconds()));
            }

            if (currentCount > rateLimit.requests()) {
                log.warn("Rate limit exceeded for key '{}'. Limit: {} req/{}s, Current: {} reqs",
                        redisKey, rateLimit.requests(), rateLimit.durationSeconds(), currentCount);
                throw AppException.tooManyRequests(
                        "Bạn đã thao tác quá nhanh. Vui lòng thử lại sau " + rateLimit.durationSeconds() + " giây",
                        "TOO_MANY_REQUESTS"
                );
            }

        } catch (AppException e) {
            // Ném lại AppException (429) — đây là lỗi business, không phải infra
            throw e;
        } catch (Exception e) {
            // Redis không khả dụng → log warn + cho phép request đi qua (availability > strict limiting)
            log.warn("Redis không khả dụng, bỏ qua rate limit cho key '{}': {}", redisKey, e.getMessage());
        }

        return joinPoint.proceed();
    }

    // ── Private helpers ───────────────────────────────────────

    /**
     * Xây dựng Redis key theo format:
     * {@code rate_limit:<methodSignature>:<keyType>:<identifier>}
     *
     * <p>Ví dụ:
     * <ul>
     *   <li>IP   → {@code rate_limit:AuthController.login():ip:1.2.3.4}
     *   <li>USER → {@code rate_limit:FlashcardController.createBulk():user:42}
     * </ul>
     */
    private String buildRedisKey(ProceedingJoinPoint joinPoint, RateLimit rateLimit,
                                 String clientIp, Long currentUserId) {
        String methodName = joinPoint.getSignature().toShortString();
        String identifier = switch (rateLimit.keyType()) {
            case IP          -> "ip:" + clientIp;
            case USER        -> "user:" + (currentUserId != null ? currentUserId : clientIp);
            case IP_AND_USER -> "ip:" + clientIp + ":user:" + (currentUserId != null ? currentUserId : "anon");
        };
        return KEY_PREFIX + methodName + ":" + identifier;
    }

    private HttpServletRequest getHttpServletRequest() {
        ServletRequestAttributes attributes =
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes == null) {
            throw AppException.badRequest("Không tìm thấy request context", "REQUEST_CONTEXT_MISSING");
        }
        return attributes.getRequest();
    }

    private String extractClientIp(HttpServletRequest request) {
        String[] headers = {
                "X-Forwarded-For",
                "Proxy-Client-IP",
                "WL-Proxy-Client-IP",
                "HTTP_CLIENT_IP",
                "HTTP_X_FORWARDED_FOR"
        };
        for (String header : headers) {
            String ip = request.getHeader(header);
            if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
                return ip.split(",")[0].trim();
            }
        }
        return request.getRemoteAddr();
    }

    private Long getCurrentUserIdSafely() {
        try {
            return SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
            return null;
        }
    }
}
