package com.dmt.toeicapp.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

// ── ForgotPasswordRequest ──────────────────────────────────────
// Bước 1 quên mật khẩu: chỉ cần email
public record ForgotPasswordRequest(

        @NotBlank(message = "Email không được để trống")
        @Email(message = "Email không hợp lệ")
        String email
) {}
