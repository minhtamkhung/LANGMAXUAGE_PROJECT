package com.dmt.toeicapp.common.security;

import com.dmt.toeicapp.common.exception.AppException;
import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.Signature;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.http.HttpStatus;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RateLimitingAspectTest {

    private RateLimitingAspect aspect;

    @Mock private StringRedisTemplate redisTemplate;
    @Mock private ValueOperations<String, String> valueOps;
    @Mock private ProceedingJoinPoint joinPoint;
    @Mock private Signature signature;
    @Mock private HttpServletRequest request;
    @Mock private RateLimit rateLimit;

    @BeforeEach
    void setUp() {
        // StringRedisTemplate.opsForValue() trả về ValueOperations mock
        when(redisTemplate.opsForValue()).thenReturn(valueOps);

        aspect = new RateLimitingAspect(redisTemplate);

        ServletRequestAttributes attributes = new ServletRequestAttributes(request);
        RequestContextHolder.setRequestAttributes(attributes);

        lenient().when(joinPoint.getSignature()).thenReturn(signature);
        lenient().when(signature.toShortString()).thenReturn("TestController.testMethod()");
        lenient().when(request.getRemoteAddr()).thenReturn("127.0.0.1");
        lenient().when(rateLimit.requests()).thenReturn(2);
        lenient().when(rateLimit.durationSeconds()).thenReturn(60);
        lenient().when(rateLimit.keyType()).thenReturn(RateLimit.KeyType.IP);
    }

    @Test
    void enforceRateLimit_allowsRequestsUnderThreshold() throws Throwable {
        // INCR trả về 1 → lần đầu trong window → set TTL
        when(valueOps.increment(anyString())).thenReturn(1L);
        when(joinPoint.proceed()).thenReturn("OK");

        Object result = aspect.enforceRateLimit(joinPoint, rateLimit);

        assertEquals("OK", result);
        verify(joinPoint).proceed();
        // TTL phải được set khi counter = 1
        verify(redisTemplate).expire(anyString(), any());
    }

    @Test
    void enforceRateLimit_allowsRequestAtExactLimit() throws Throwable {
        // count = 2 == requests → vẫn được phép (<=)
        when(valueOps.increment(anyString())).thenReturn(2L);
        when(joinPoint.proceed()).thenReturn("OK");

        Object result = aspect.enforceRateLimit(joinPoint, rateLimit);

        assertEquals("OK", result);
        verify(joinPoint).proceed();
    }

    @Test
    void enforceRateLimit_blocksRequestExceedingThreshold() throws Throwable {
        // count = 3 > requests(2) → phải throw 429
        when(valueOps.increment(anyString())).thenReturn(3L);

        AppException ex = assertThrows(AppException.class,
                () -> aspect.enforceRateLimit(joinPoint, rateLimit));

        assertEquals(HttpStatus.TOO_MANY_REQUESTS, ex.getStatus());
        assertEquals("TOO_MANY_REQUESTS", ex.getCode());
        // joinPoint.proceed() không được gọi khi bị block
        verify(joinPoint, never()).proceed();
    }

    @Test
    void enforceRateLimit_redisDown_allowsRequestThrough() throws Throwable {
        // Redis ném exception → fallback: cho request đi qua
        when(valueOps.increment(anyString())).thenThrow(new RuntimeException("Redis connection refused"));
        when(joinPoint.proceed()).thenReturn("OK");

        Object result = aspect.enforceRateLimit(joinPoint, rateLimit);

        assertEquals("OK", result);
        verify(joinPoint).proceed();
    }

    @Test
    void enforceRateLimit_redisReturnsNull_allowsRequestThrough() throws Throwable {
        // INCR trả về null (bất thường) → cho qua
        when(valueOps.increment(anyString())).thenReturn(null);
        when(joinPoint.proceed()).thenReturn("OK");

        Object result = aspect.enforceRateLimit(joinPoint, rateLimit);

        assertEquals("OK", result);
    }
}
