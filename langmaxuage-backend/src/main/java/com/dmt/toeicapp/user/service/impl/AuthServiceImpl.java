package com.dmt.toeicapp.user.service.impl;

import com.dmt.toeicapp.common.exception.AppException;
import com.dmt.toeicapp.common.security.JwtUtil;
import com.dmt.toeicapp.user.dto.AuthResponse;
import com.dmt.toeicapp.user.dto.LoginRequest;
import com.dmt.toeicapp.user.dto.RegisterRequest;
import com.dmt.toeicapp.user.entity.User;
import com.dmt.toeicapp.user.repository.UserRepository;
import com.dmt.toeicapp.user.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository      userRepository;
    private final PasswordEncoder     passwordEncoder;
    private final JwtUtil             jwtUtil;
    private final StringRedisTemplate redisTemplate;

    private static final String REFRESH_TOKEN_PREFIX = "refresh_token:";

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw AppException.conflict("Email đã được sử dụng", "EMAIL_ALREADY_EXISTS");
        }
        if (userRepository.existsByUsername(request.username())) {
            throw AppException.conflict("Username đã được sử dụng", "USERNAME_ALREADY_EXISTS");
        }

        User user = User.builder()
                .username(request.username())
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .role(User.Role.USER)
                .build();

        userRepository.save(user);
        log.info("User mới đăng ký: {}", user.getEmail());

        return buildAuthResponse(user);
    }

    // ── BUG #2 FIX ─────────────────────────────────────────────────────────────
    // BUG CŨ: @Transactional(readOnly = true) — vi phạm vì buildAuthResponse()
    //         ghi refreshToken vào Redis bên trong cùng luồng gọi này.
    //         readOnly=true trên một số cấu hình Spring/Redis sẽ throw exception
    //         hoặc silently ignore write, gây mất token.
    // FIX:    Bỏ readOnly — login() là write operation (ghi Redis).
    // ───────────────────────────────────────────────────────────────────────────
    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> AppException.badRequest(
                        "Email hoặc mật khẩu không đúng", "INVALID_CREDENTIALS"));

        if (!user.isActive()) {
            throw AppException.forbidden("Tài khoản đã bị vô hiệu hóa");
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw AppException.badRequest("Email hoặc mật khẩu không đúng", "INVALID_CREDENTIALS");
        }

        log.info("User đăng nhập: {}", user.getEmail());
        return buildAuthResponse(user);
    }

    // ── BUG #2 FIX (cùng vấn đề) ───────────────────────────────────────────────
    // refresh() cũng gọi buildAuthResponse() → ghi Redis → không được readOnly.
    // ───────────────────────────────────────────────────────────────────────────
    @Override
    @Transactional
    public AuthResponse refresh(String refreshToken) {
        if (!jwtUtil.isValid(refreshToken) || !jwtUtil.isRefreshToken(refreshToken)) {
            throw AppException.badRequest("Refresh token không hợp lệ", "TOKEN_INVALID");
        }

        Long userId = jwtUtil.extractUserId(refreshToken);

        String redisKey    = REFRESH_TOKEN_PREFIX + userId;
        String storedToken = redisTemplate.opsForValue().get(redisKey);

        if (!refreshToken.equals(storedToken)) {
            throw AppException.badRequest("Refresh token đã hết hạn hoặc đã bị thu hồi", "TOKEN_EXPIRED");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy user"));

        if (!user.isActive()) {
            throw AppException.forbidden("Tài khoản đã bị vô hiệu hóa");
        }

        return buildAuthResponse(user);
    }

    @Override
    public void logout(String refreshToken) {
        if (!jwtUtil.isValid(refreshToken)) return;

        Long   userId   = jwtUtil.extractUserId(refreshToken);
        String redisKey = REFRESH_TOKEN_PREFIX + userId;
        redisTemplate.delete(redisKey);
        log.info("User logout, revoked refresh token userId={}", userId);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private AuthResponse buildAuthResponse(User user) {
        String accessToken  = jwtUtil.generateAccessToken(user);
        String refreshToken = jwtUtil.generateRefreshToken(user);

        // ── BUG #1 FIX ───────────────────────────────────────────────────────
        // BUG CŨ: redisTemplate.opsForValue().set(
        //             redisKey, refreshToken,
        //             jwtUtil.getRefreshTokenTtlMs(),  ← trả về milliseconds
        //             TimeUnit.DAYS                    ← nhưng đơn vị là DAYS!
        //         );
        //         → TTL thực tế = getRefreshTokenTtlMs() * 86_400_000 ms
        //           Nếu getRefreshTokenTtlMs() = 604_800_000 (7 ngày tính bằng ms),
        //           TTL Redis sẽ là ~52 tỷ ngày. Token tồn tại vĩnh viễn!
        //
        // FIX:   Dùng TimeUnit.MILLISECONDS để khớp với giá trị ms trả về.
        // ────────────────────────────────────────────────────────────────────
        String redisKey = REFRESH_TOKEN_PREFIX + user.getId();
        redisTemplate.opsForValue().set(
                redisKey,
                refreshToken,
                jwtUtil.getRefreshTokenTtlMs(),
                TimeUnit.MILLISECONDS  // ← FIX: đúng đơn vị với getRefreshTokenTtlMs()
        );

        // ttlSec dùng để trả về cho FE biết accessToken hết hạn khi nào
        long ttlSec = jwtUtil.getAccessTokenTtlMs() / 1000;

        return AuthResponse.of(
                accessToken,
                refreshToken,
                ttlSec,
                new AuthResponse.UserInfo(
                        user.getId(),
                        user.getUsername(),
                        user.getEmail(),
                        user.getRole().name()
                )
        );
    }
}