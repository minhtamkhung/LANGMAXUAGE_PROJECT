package com.dmt.toeicapp.common.security;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Custom annotation dùng cho AOP Rate Limiting trên Controller methods.
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RateLimit {

    /**
     * Số request tối đa được phép trong khoảng thời gian durationSeconds.
     */
    int requests() default 10;

    /**
     * Khoảng thời gian (tính bằng giây). Mặc định 60s.
     */
    int durationSeconds() default 60;

    /**
     * Loại Key dùng để phân biệt client.
     */
    KeyType keyType() default KeyType.IP;

    enum KeyType {
        IP,
        USER,
        IP_AND_USER
    }
}
