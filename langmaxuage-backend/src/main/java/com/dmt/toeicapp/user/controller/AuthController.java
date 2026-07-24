package com.dmt.toeicapp.user.controller;

import com.dmt.toeicapp.common.response.ApiResponse;
import com.dmt.toeicapp.common.security.RateLimit;
import com.dmt.toeicapp.user.dto.AuthResponse;
import com.dmt.toeicapp.user.dto.ForgotPasswordRequest;
import com.dmt.toeicapp.user.dto.GoogleLoginRequest;
import com.dmt.toeicapp.user.dto.LoginRequest;
import com.dmt.toeicapp.user.dto.RegisterRequest;
import com.dmt.toeicapp.user.dto.ResetPasswordRequest;
import com.dmt.toeicapp.user.dto.SendOtpRequest;
import com.dmt.toeicapp.user.dto.VerifyOtpRequest;
import com.dmt.toeicapp.user.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // ── Đăng ký thường (không OTP) ────────────────────────────────
    @RateLimit(requests = 5, durationSeconds = 60, keyType = RateLimit.KeyType.IP)
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(201).body(
                ApiResponse.created(authService.register(request))
        );
    }

    // ── Đăng ký có OTP (2 bước) ──────────────────────────────────

    /** Bước 1: validate info → gửi OTP qua email */
    @RateLimit(requests = 3, durationSeconds = 60, keyType = RateLimit.KeyType.IP)
    @PostMapping("/send-otp")
    public ResponseEntity<ApiResponse<Void>> sendOtp(
            @Valid @RequestBody SendOtpRequest request) {
        authService.sendOtp(request);
        return ResponseEntity.ok(
                ApiResponse.ok(null, "Mã OTP đã được gửi tới " + request.email())
        );
    }

    /** Bước 2: xác nhận OTP → tạo tài khoản → trả token */
    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyOtp(
            @Valid @RequestBody VerifyOtpRequest request) {
        return ResponseEntity.status(201).body(
                ApiResponse.created(authService.verifyAndRegister(request))
        );
    }

    @RateLimit(requests = 5, durationSeconds = 60, keyType = RateLimit.KeyType.IP)
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(
                ApiResponse.ok(authService.login(request), "Đăng nhập thành công")
        );
    }

    @RateLimit(requests = 5, durationSeconds = 60, keyType = RateLimit.KeyType.IP)
    @PostMapping("/google")
    public ResponseEntity<ApiResponse<AuthResponse>> loginWithGoogle(
            @Valid @RequestBody GoogleLoginRequest request) {
        return ResponseEntity.ok(
                ApiResponse.ok(authService.loginWithGoogle(request), "Đăng nhập bằng tài khoản Google thành công")
        );
    }

    @RateLimit(requests = 3, durationSeconds = 60, keyType = RateLimit.KeyType.IP)
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok(
                ApiResponse.ok(null, "Mã OTP đặt lại mật khẩu đã được gửi tới " + request.email())
        );
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(
                ApiResponse.ok(null, "Đặt lại mật khẩu thành công")
        );
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            @RequestHeader("X-Refresh-Token") String refreshToken) {
        return ResponseEntity.ok(
                ApiResponse.ok(authService.refresh(refreshToken))
        );
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @RequestHeader("X-Refresh-Token") String refreshToken) {
        authService.logout(refreshToken);
        return ResponseEntity.noContent().build(); // 204
    }
}