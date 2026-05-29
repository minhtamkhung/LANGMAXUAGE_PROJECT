package com.dmt.toeicapp.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)  // bỏ qua field null trong JSON output
public class ApiResponse<T> {

    private boolean success;
    private String  message;
    private String  code;     // error code — null khi success
    private T       data;     // payload — null khi error

    // ── Success factories ──────────────────────────────────────

    public static <T> ApiResponse<T> ok(T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message("OK")
                .data(data)
                .build();
    }

    public static <T> ApiResponse<T> ok(T data, String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .build();
    }

    public static <T> ApiResponse<T> created(T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message("Tạo mới thành công")
                .data(data)
                .build();
    }

    // ── Error factories ────────────────────────────────────────

    public static <T> ApiResponse<T> error(String message, String code) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .code(code)
                .build();
    }

    public static <T> ApiResponse<T> validationError(T fieldErrors) {
        return ApiResponse.<T>builder()
                .success(false)
                .message("Dữ liệu đầu vào không hợp lệ")
                .code("VALIDATION_ERROR")
                .data(fieldErrors)
                .build();
    }
}