package com.dmt.toeicapp.user.dto;

import jakarta.validation.constraints.NotBlank;

// ── LoginRequest ──────────────────────────────────────────────
public record LoginRequest(

        @NotBlank(message = "Email không được để trống")
        String email,

        @NotBlank(message = "Mật khẩu không được để trống")
        String password
) {}