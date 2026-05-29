package com.dmt.toeicapp.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class AppException extends RuntimeException {

    private final String     code;
    private final HttpStatus status;

    public AppException(String message, String code, HttpStatus status) {
        super(message);
        this.code   = code;
        this.status = status;
    }

    // ── Static factories cho từng loại lỗi phổ biến ───────────

    public static AppException notFound(String message) {
        return new AppException(message, "NOT_FOUND", HttpStatus.NOT_FOUND);
    }

    public static AppException forbidden(String message) {
        return new AppException(message, "FORBIDDEN", HttpStatus.FORBIDDEN);
    }

    public static AppException badRequest(String message, String code) {
        return new AppException(message, code, HttpStatus.BAD_REQUEST);
    }

    public static AppException conflict(String message, String code) {
        return new AppException(message, code, HttpStatus.CONFLICT);
    }
}