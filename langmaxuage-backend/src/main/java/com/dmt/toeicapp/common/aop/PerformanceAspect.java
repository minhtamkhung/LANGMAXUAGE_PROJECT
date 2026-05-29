package com.dmt.toeicapp.common.aop;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.stereotype.Component;

@Slf4j
@Aspect
@Component
public class PerformanceAspect {

    private static final long WARN_THRESHOLD_MS  = 500;   // WARN nếu > 500ms
    private static final long ERROR_THRESHOLD_MS = 2000;  // ERROR nếu > 2s

    @Pointcut("execution(* com.dmt.toeicapp..service..*(..))")
    public void serviceLayer() {}

    @Around("serviceLayer()")
    public Object monitorPerformance(ProceedingJoinPoint jp) throws Throwable {
        long start   = System.currentTimeMillis();
        Object result = jp.proceed();
        long elapsed = System.currentTimeMillis() - start;

        String className  = jp.getSignature().getDeclaringType().getSimpleName();
        String methodName = jp.getSignature().getName();

        if (elapsed >= ERROR_THRESHOLD_MS) {
            log.error("🐢 SLOW METHOD {}.{}() took {}ms — investigate immediately!",
                    className, methodName, elapsed);
        } else if (elapsed >= WARN_THRESHOLD_MS) {
            log.warn("⚠ SLOW METHOD {}.{}() took {}ms — consider optimization",
                    className, methodName, elapsed);
        }

        return result;
    }
}