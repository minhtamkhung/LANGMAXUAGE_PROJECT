package com.dmt.toeicapp.user.service;

import com.dmt.toeicapp.user.dto.AuthResponse;
import com.dmt.toeicapp.user.dto.LoginRequest;
import com.dmt.toeicapp.user.dto.RegisterRequest;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    // Dùng refresh token để lấy access token mới
    AuthResponse refresh(String refreshToken);

    // Vô hiệu hóa refresh token trong Redis
    void logout(String refreshToken);
}