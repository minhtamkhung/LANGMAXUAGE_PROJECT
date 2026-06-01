package com.dmt.toeicapp.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

// ── ResetPasswordRequest ───────────────────────────────────────
// Bước 2 quên mật khẩu: xác nhận OTP + đặt mật khẩu mới
public record ResetPasswordRequest(

        @NotBlank(message = "Email không được để trống")
        @Email(message = "Email không hợp lệ")
        String email,

        @NotBlank(message = "OTP không được để trống")
        @Pattern(regexp = "\\d{6}", message = "OTP phải là 6 chữ số")
        String otp,

        @NotBlank(message = "Mật khẩu mới không được để trống")
        @Size(min = 6, message = "Mật khẩu ít nhất 6 ký tự")
        String newPassword
) {}
