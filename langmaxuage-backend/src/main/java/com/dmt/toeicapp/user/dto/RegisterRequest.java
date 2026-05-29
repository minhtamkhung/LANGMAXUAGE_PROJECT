package com.dmt.toeicapp.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// ── RegisterRequest ───────────────────────────────────────────
public record RegisterRequest(

        @NotBlank(message = "Username không được để trống")
        @Size(min = 3, max = 50, message = "Username từ 3 đến 50 ký tự")
        String username,

        @NotBlank(message = "Email không được để trống")
        @Email(message = "Email không hợp lệ")
        String email,

        @NotBlank(message = "Mật khẩu không được để trống")
        @Size(min = 6, message = "Mật khẩu ít nhất 6 ký tự")
        String password
) {}