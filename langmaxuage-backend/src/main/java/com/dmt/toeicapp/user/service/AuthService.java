package com.dmt.toeicapp.user.service;

import com.dmt.toeicapp.user.dto.AuthResponse;
import com.dmt.toeicapp.user.dto.ForgotPasswordRequest;
import com.dmt.toeicapp.user.dto.GoogleLoginRequest;
import com.dmt.toeicapp.user.dto.LoginRequest;
import com.dmt.toeicapp.user.dto.RegisterRequest;
import com.dmt.toeicapp.user.dto.ResetPasswordRequest;
import com.dmt.toeicapp.user.dto.SendOtpRequest;
import com.dmt.toeicapp.user.dto.VerifyOtpRequest;

public interface AuthService {

    // ── Đăng ký thường (không OTP) ────────────────────────
    AuthResponse register(RegisterRequest request);

    // ── Đăng ký có OTP (2 bước) ───────────────────────────
    /** Bước 1: validate info → gửi OTP về email */
    void sendOtp(SendOtpRequest request);

    /** Bước 2: verify OTP → tạo user → trả token */
    AuthResponse verifyAndRegister(VerifyOtpRequest request);

    // ── Đăng nhập ─────────────────────────────────────────
    AuthResponse login(LoginRequest request);

    AuthResponse loginWithGoogle(GoogleLoginRequest request);

    // ── Quên mật khẩu (2 bước) ────────────────────────────
    /** Bước 1: kiểm tra email tồn tại → gửi OTP reset password */
    void forgotPassword(ForgotPasswordRequest request);

    /** Bước 2: verify OTP → đổi password mới */
    void resetPassword(ResetPasswordRequest request);

    // ── Token management ──────────────────────────────────
    AuthResponse refresh(String refreshToken);

    void logout(String refreshToken);
}
