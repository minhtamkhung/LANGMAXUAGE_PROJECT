package com.dmt.toeicapp.user.dto;

// ── AuthResponse ──────────────────────────────────────────────
// Trả về sau login/register thành công
public record AuthResponse(
        String accessToken,
        String refreshToken,
        String tokenType,     // luôn là "Bearer"
        long   expiresIn,     // access token TTL tính bằng giây
        UserInfo user
) {
    // Nested record — thông tin user cơ bản, không trả password
    public record UserInfo(
            Long   id,
            String username,
            String email,
            String role
    ) {}

    // Static factory — gọn hơn khi dùng trong Service
    public static AuthResponse of(String accessToken, String refreshToken,
                                  long expiresIn, UserInfo user) {
        return new AuthResponse(accessToken, refreshToken, "Bearer", expiresIn, user);
    }
}