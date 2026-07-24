package com.dmt.toeicapp.user.service.impl;

import com.dmt.toeicapp.common.email.EmailService;
import com.dmt.toeicapp.common.exception.AppException;
import com.dmt.toeicapp.common.security.JwtUtil;
import com.dmt.toeicapp.user.dto.AuthResponse;
import com.dmt.toeicapp.user.dto.ForgotPasswordRequest;
import com.dmt.toeicapp.user.dto.GoogleLoginRequest;
import com.dmt.toeicapp.user.dto.LoginRequest;
import com.dmt.toeicapp.user.dto.RegisterRequest;
import com.dmt.toeicapp.user.dto.ResetPasswordRequest;
import com.dmt.toeicapp.user.dto.SendOtpRequest;
import com.dmt.toeicapp.user.dto.VerifyOtpRequest;
import com.dmt.toeicapp.user.entity.User;
import com.dmt.toeicapp.user.repository.UserRepository;
import com.dmt.toeicapp.user.service.AuthService;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository         userRepository;
    private final PasswordEncoder        passwordEncoder;
    private final JwtUtil                jwtUtil;
    private final StringRedisTemplate    redisTemplate;
    private final EmailService           emailService;
    private final GoogleIdTokenVerifier  googleIdTokenVerifier; // ← Singleton Bean, inject qua constructor
    private final long                   otpTtlMinutes;
    private final int                    otpMaxAttempts;
    private final int                    sendOtpMaxPerHour;

    // ── Redis key prefixes ──────────────────────────────────────────────────────
    private static final String REFRESH_TOKEN_PREFIX  = "refresh_token:";
    private static final String OTP_PREFIX            = "otp:";
    private static final String PENDING_REG_PREFIX    = "pending_reg:";
    private static final String PWD_RESET_OTP_PREFIX  = "pwd_reset_otp:";
    /** Đếm số lần nhập sai OTP (verify-otp / reset-password) */
    private static final String OTP_ATTEMPTS_PREFIX   = "otp_attempts:";
    /** Đếm số lần gửi OTP trong vòng 1 giờ (send-otp / forgot-password) */
    private static final String SEND_OTP_RATE_PREFIX  = "send_otp_rate:";

    public AuthServiceImpl(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtUtil jwtUtil,
            StringRedisTemplate redisTemplate,
            EmailService emailService,
            GoogleIdTokenVerifier googleIdTokenVerifier,      // ← inject Singleton Bean
            @Value("${app.otp.ttl-minutes:5}") long otpTtlMinutes,
            @Value("${app.rate-limit.otp-max-attempts:5}") int otpMaxAttempts,
            @Value("${app.rate-limit.send-otp-max-per-hour:3}") int sendOtpMaxPerHour) {
        this.userRepository        = userRepository;
        this.passwordEncoder       = passwordEncoder;
        this.jwtUtil               = jwtUtil;
        this.redisTemplate         = redisTemplate;
        this.emailService          = emailService;
        this.googleIdTokenVerifier = googleIdTokenVerifier;
        this.otpTtlMinutes         = otpTtlMinutes;
        this.otpMaxAttempts        = otpMaxAttempts;
        this.sendOtpMaxPerHour     = sendOtpMaxPerHour;
    }

    // ── Bước 1: Gửi OTP ──────────────────────────────────────────────────────

    @Override
    public void sendOtp(SendOtpRequest request) {
        // ── [SECURITY] Rate limit: tối đa sendOtpMaxPerHour lần gửi/email/giờ ──
        // Ngăn email bombing và information enumeration (biết email nào đã tồn tại)
        checkSendOtpRateLimit(request.email());

        // Validate email/username chưa tồn tại
        if (userRepository.existsByEmail(request.email())) {
            throw AppException.conflict("Email đã được sử dụng", "EMAIL_ALREADY_EXISTS");
        }
        if (userRepository.existsByUsername(request.username())) {
            throw AppException.conflict("Username đã được sử dụng", "USERNAME_ALREADY_EXISTS");
        }

        // Sinh OTP 6 số
        String otp = generateOtp();

        // Lưu OTP vào Redis: key = "otp:{email}", TTL = otpTtlMinutes phút
        redisTemplate.opsForValue().set(
                OTP_PREFIX + request.email(),
                otp,
                otpTtlMinutes,
                TimeUnit.MINUTES
        );

        // Lưu thông tin đăng ký tạm: key = "pending_reg:{email}"
        // Format: "username|||passwordHash" (dùng ||| để tránh conflict với ký tự thường)
        String passwordHash = passwordEncoder.encode(request.password());
        String pendingValue = request.username() + "|||" + passwordHash;
        redisTemplate.opsForValue().set(
                PENDING_REG_PREFIX + request.email(),
                pendingValue,
                otpTtlMinutes,
                TimeUnit.MINUTES
        );

        // Gửi email OTP (async — không block)
        emailService.sendOtpEmail(request.email(), otp);

        log.info("Đã gửi OTP đến email: {} (TTL: {} phút)", request.email(), otpTtlMinutes);
    }

    // ── Bước 2: Xác thực OTP + Tạo user ─────────────────────────────────────

    @Override
    @Transactional
    public AuthResponse verifyAndRegister(VerifyOtpRequest request) {
        String otpKey      = OTP_PREFIX + request.email();
        String pendingKey  = PENDING_REG_PREFIX + request.email();
        String attemptsKey = OTP_ATTEMPTS_PREFIX + "reg:" + request.email();

        // ── [SECURITY] Kiểm tra số lần thử sai OTP ────────────────────────────
        checkOtpAttempts(attemptsKey);

        // Lấy OTP từ Redis
        String storedOtp = redisTemplate.opsForValue().get(otpKey);
        if (storedOtp == null) {
            throw AppException.badRequest("Mã OTP đã hết hạn. Vui lòng gửi lại.", "OTP_EXPIRED");
        }
        if (!storedOtp.equals(request.otp())) {
            recordFailedAttempt(attemptsKey, otpTtlMinutes);
            int used = getAttemptCount(attemptsKey);
            int remaining = otpMaxAttempts - used;
            throw AppException.badRequest(
                    remaining > 0
                            ? "Mã OTP không đúng. Còn " + remaining + " lần thử."
                            : "Mã OTP không đúng. Vui lòng yêu cầu OTP mới.",
                    "OTP_INVALID"
            );
        }

        // Lấy thông tin đăng ký tạm
        String pendingValue = redisTemplate.opsForValue().get(pendingKey);
        if (pendingValue == null) {
            throw AppException.badRequest("Phiên đăng ký đã hết hạn. Vui lòng bắt đầu lại.", "SESSION_EXPIRED");
        }

        String[] parts       = pendingValue.split("\\|\\|\\|", 2);
        String   username    = parts[0];
        String   passwordHash = parts[1];

        // Kiểm tra lần cuối (tránh race condition)
        if (userRepository.existsByEmail(request.email())) {
            throw AppException.conflict("Email đã được sử dụng", "EMAIL_ALREADY_EXISTS");
        }
        if (userRepository.existsByUsername(username)) {
            throw AppException.conflict("Username đã được sử dụng", "USERNAME_ALREADY_EXISTS");
        }

        // Tạo user
        User user = User.builder()
                .username(username)
                .email(request.email())
                .passwordHash(passwordHash)
                .role(User.Role.USER)
                .build();
        userRepository.save(user);

        // Xóa OTP, pending data và attempt counter khỏi Redis
        redisTemplate.delete(otpKey);
        redisTemplate.delete(pendingKey);
        redisTemplate.delete(attemptsKey);

        log.info("User mới đăng ký qua OTP: {}", user.getEmail());
        return buildAuthResponse(user);
    }

    // ── Quên mật khẩu (2 bước) ──────────────────────────────────────────────

    @Override
    public void forgotPassword(ForgotPasswordRequest request) {
        // ── [SECURITY] Rate limit: tối đa sendOtpMaxPerHour lần gửi/email/giờ ──
        checkSendOtpRateLimit(request.email());

        // Kiểm tra email có tồn tại không
        userRepository.findByEmail(request.email())
                .orElseThrow(() -> AppException.notFound("Địa chỉ email không tồn tại trong hệ thống"));

        // Sinh OTP và lưu Redis
        String otp      = generateOtp();
        String redisKey = PWD_RESET_OTP_PREFIX + request.email();
        redisTemplate.opsForValue().set(redisKey, otp, otpTtlMinutes, TimeUnit.MINUTES);

        // Gửi email (async)
        emailService.sendPasswordResetEmail(request.email(), otp);
        log.info("Đã gửi OTP đặt lại mật khẩu tới: {}", request.email());
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String redisKey    = PWD_RESET_OTP_PREFIX + request.email();
        String attemptsKey = OTP_ATTEMPTS_PREFIX + "pwd:" + request.email();

        // ── [SECURITY] Kiểm tra số lần thử sai OTP ────────────────────────────
        checkOtpAttempts(attemptsKey);

        String storedOtp = redisTemplate.opsForValue().get(redisKey);
        if (storedOtp == null) {
            throw AppException.badRequest("Mã OTP đã hết hạn. Vui lòng yêu cầu lại.", "OTP_EXPIRED");
        }
        if (!storedOtp.equals(request.otp())) {
            recordFailedAttempt(attemptsKey, otpTtlMinutes);
            int used = getAttemptCount(attemptsKey);
            int remaining = otpMaxAttempts - used;
            throw AppException.badRequest(
                    remaining > 0
                            ? "Mã OTP không đúng. Còn " + remaining + " lần thử."
                            : "Mã OTP không đúng. Vui lòng yêu cầu OTP mới.",
                    "OTP_INVALID"
            );
        }

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> AppException.notFound("Địa chỉ email không tồn tại"));

        // Cập nhật password mới
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        // Xoá OTP, attempt counter và refresh token (force re-login)
        redisTemplate.delete(redisKey);
        redisTemplate.delete(attemptsKey);
        redisTemplate.delete(REFRESH_TOKEN_PREFIX + user.getId());

        log.info("User đặt lại mật khẩu thành công: {}", user.getEmail());
    }

    // ── Đăng ký thường (không OTP — giữ backward compat) ─────────────────────

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
        log.info("User mới đăng ký (không OTP): {}", user.getEmail());
        return buildAuthResponse(user);
    }

    // ── Đăng nhập ─────────────────────────────────────────────────────────────

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

    // ── Google OAuth2 ─────────────────────────────────────────────────────────

    @Override
    @Transactional
    public AuthResponse loginWithGoogle(GoogleLoginRequest request) {
        // ── [SECURITY] Dùng Singleton Bean — không tạo mới mỗi request ─────────
        if (googleIdTokenVerifier == null) {
            throw AppException.badRequest("Chức năng đăng nhập Google tạm thời không khả dụng.", "GOOGLE_AUTH_UNAVAILABLE");
        }

        try {
            GoogleIdToken idToken = googleIdTokenVerifier.verify(request.getIdToken());
            if (idToken == null) {
                throw AppException.badRequest("Google ID Token không hợp lệ", "INVALID_GOOGLE_TOKEN");
            }

            GoogleIdToken.Payload payload  = idToken.getPayload();
            String                email    = payload.getEmail();

            User user = userRepository.findByEmail(email)
                    .orElseGet(() -> {
                        String defaultUsername = email.split("@")[0];
                        User newUser = User.builder()
                                .email(email)
                                .username(defaultUsername)
                                .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                                .role(User.Role.USER)
                                .build();
                        return userRepository.save(newUser);
                    });

            if (!user.isActive()) {
                throw AppException.forbidden("Tài khoản đã bị vô hiệu hóa");
            }

            log.info("User đăng nhập qua Google: {}", user.getEmail());
            return buildAuthResponse(user);

        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Lỗi xác thực Google OAuth2: ", e);
            throw AppException.badRequest("Xác thực Google thất bại", "GOOGLE_AUTH_FAILED");
        }
    }

    // ── Token management ──────────────────────────────────────────────────────

    @Override
    @Transactional
    public AuthResponse refresh(String refreshToken) {
        if (!jwtUtil.isValid(refreshToken) || !jwtUtil.isRefreshToken(refreshToken)) {
            throw AppException.badRequest("Refresh token không hợp lệ", "TOKEN_INVALID");
        }

        Long   userId     = jwtUtil.extractUserId(refreshToken);
        String redisKey   = REFRESH_TOKEN_PREFIX + userId;
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

    private String generateOtp() {
        SecureRandom random = new SecureRandom();
        int otp = 100_000 + random.nextInt(900_000);  // [100000, 999999]
        return String.valueOf(otp);
    }

    /**
     * Kiểm tra và chặn nếu đã vượt quá giới hạn số lần nhập sai OTP.
     * Throw ngay lập tức nếu đã bị khoá.
     */
    private void checkOtpAttempts(String attemptsKey) {
        String val = redisTemplate.opsForValue().get(attemptsKey);
        int attempts = val != null ? Integer.parseInt(val) : 0;
        if (attempts >= otpMaxAttempts) {
            throw AppException.badRequest(
                    "Bạn đã nhập sai OTP quá " + otpMaxAttempts + " lần. Vui lòng yêu cầu OTP mới.",
                    "OTP_MAX_ATTEMPTS_EXCEEDED"
            );
        }
    }

    /**
     * Tăng counter số lần nhập sai OTP.
     * TTL của counter = TTL của OTP (khi OTP hết hạn, counter cũng tự xoá).
     */
    private void recordFailedAttempt(String attemptsKey, long ttlMinutes) {
        redisTemplate.opsForValue().increment(attemptsKey);
        // Chỉ set expire nếu key vừa được tạo (tránh reset TTL mỗi lần thất bại)
        if (Boolean.FALSE.equals(redisTemplate.hasKey(attemptsKey))
                || redisTemplate.getExpire(attemptsKey, TimeUnit.SECONDS) < 0) {
            redisTemplate.expire(attemptsKey, ttlMinutes, TimeUnit.MINUTES);
        }
    }

    /**
     * Lấy số lần đã thử từ Redis (dùng để tính số lần còn lại để hiển thị).
     */
    private int getAttemptCount(String attemptsKey) {
        String val = redisTemplate.opsForValue().get(attemptsKey);
        return val != null ? Integer.parseInt(val) : 0;
    }

    /**
     * [SECURITY] Rate limit gửi OTP: tối đa sendOtpMaxPerHour lần/email/giờ.
     * Ngăn chặn:
     *   1. Email bombing (spam hàng nghìn email tới nạn nhân)
     *   2. Information enumeration (gửi liên tục để biết email nào đã đăng ký)
     */
    private void checkSendOtpRateLimit(String email) {
        String rateKey = SEND_OTP_RATE_PREFIX + email;
        String val     = redisTemplate.opsForValue().get(rateKey);
        int count      = val != null ? Integer.parseInt(val) : 0;

        if (count >= sendOtpMaxPerHour) {
            throw AppException.badRequest(
                    "Bạn đã yêu cầu OTP quá " + sendOtpMaxPerHour + " lần trong vòng 1 giờ. Vui lòng thử lại sau.",
                    "SEND_OTP_RATE_EXCEEDED"
            );
        }

        // Tăng counter, TTL = 1 giờ (window trượt)
        redisTemplate.opsForValue().increment(rateKey);
        if (count == 0) {
            // Chỉ set TTL khi counter vừa được tạo
            redisTemplate.expire(rateKey, 1, TimeUnit.HOURS);
        }
    }

    private AuthResponse buildAuthResponse(User user) {
        String accessToken  = jwtUtil.generateAccessToken(user);
        String refreshToken = jwtUtil.generateRefreshToken(user);

        String redisKey = REFRESH_TOKEN_PREFIX + user.getId();
        redisTemplate.opsForValue().set(
                redisKey,
                refreshToken,
                jwtUtil.getRefreshTokenTtlMs(),
                TimeUnit.MILLISECONDS
        );

        long ttlSec = jwtUtil.getAccessTokenTtlMs() / 1000;

        return AuthResponse.of(
                accessToken,
                refreshToken,
                ttlSec,
                new AuthResponse.UserInfo(
                        user.getId(),
                        user.getUsername(),
                        user.getEmail(),
                        user.getRole().name(),
                        user.isOnboarded(),
                        user.getTargetScore(),
                        user.getDailyGoalMinutes()
                )
        );
    }
}