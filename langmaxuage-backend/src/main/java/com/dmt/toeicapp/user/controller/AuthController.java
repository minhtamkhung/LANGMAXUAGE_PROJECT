package com.dmt.toeicapp.user.controller;

import com.dmt.toeicapp.common.response.ApiResponse;
import com.dmt.toeicapp.user.dto.AuthResponse;
import com.dmt.toeicapp.user.dto.LoginRequest;
import com.dmt.toeicapp.user.dto.RegisterRequest;
import com.dmt.toeicapp.user.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(201).body(
                ApiResponse.created(authService.register(request))
        );
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(
                ApiResponse.ok(authService.login(request), "Đăng nhập thành công")
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