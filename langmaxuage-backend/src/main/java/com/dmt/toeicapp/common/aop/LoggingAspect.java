package com.dmt.toeicapp.common.aop;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.AfterThrowing;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Slf4j
@Aspect
@Component
public class LoggingAspect {

    // Pointcut — áp dụng cho toàn bộ service layer
    @Pointcut("execution(* com.dmt.toeicapp..service..*(..))")
    public void serviceLayer() {}

    // Log tên method + arguments khi vào + thời gian thực thi khi ra
    @Around("serviceLayer()")
    public Object logAround(ProceedingJoinPoint jp) throws Throwable {
        String className  = jp.getSignature().getDeclaringType().getSimpleName();
        String methodName = jp.getSignature().getName();

        log.debug("→ {}.{}() args: {}",
                className, methodName, Arrays.toString(jp.getArgs()));

        long start  = System.currentTimeMillis();
        Object result = jp.proceed();
        long elapsed = System.currentTimeMillis() - start;

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
}