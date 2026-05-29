package com.dmt.toeicapp.common.security;

import com.dmt.toeicapp.user.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Slf4j
@Component
public class JwtUtil {

    private final SecretKey secretKey;
    private final long      accessTokenTtlMs;
    private final long      refreshTokenTtlMs;

    // Constructor injection cho @Value — không dùng field injection
    public JwtUtil(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.access-token-expiration-ms}") long accessTokenTtlMs,
            @Value("${app.jwt.refresh-token-expiration-ms}") long refreshTokenTtlMs) {
        this.secretKey         = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenTtlMs  = accessTokenTtlMs;
        this.refreshTokenTtlMs = refreshTokenTtlMs;
    }

    // ── Generate ──────────────────────────────────────────────

    public String generateAccessToken(User user) {
        return buildToken(user, accessTokenTtlMs, "access");
    }

    public String generateRefreshToken(User user) {
        return buildToken(user, refreshTokenTtlMs, "refresh");
    }

    public long getAccessTokenTtlMs() {
        return accessTokenTtlMs;
    }

    public long getRefreshTokenTtlMs(){
        return refreshTokenTtlMs;
    }

    // ── Parse & Validate ──────────────────────────────────────

    public boolean isValid(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("JWT không hợp lệ: {}", e.getMessage());
            return false;
        }
    }

    public Long extractUserId(String token) {
        return parseClaims(token).get("userId", Long.class);
    }

    public String extractTokenType(String token) {
        return parseClaims(token).get("type", String.class);
    }

    public boolean isAccessToken(String token) {
        return "access".equals(extractTokenType(token));
    }

    public boolean isRefreshToken(String token) {
        return "refresh".equals(extractTokenType(token));
    }

    // ── Private helpers ───────────────────────────────────────

    private String buildToken(User user, long ttlMs, String type) {
        Date now    = new Date();
        Date expiry = new Date(now.getTime() + ttlMs);

        return Jwts.builder()
                .subject(user.getId().toString())
                .claim("userId",   user.getId())
                .claim("username", user.getUsername())
                .claim("role",     user.getRole().name())
                .claim("type",     type)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(secretKey)
                .compact();
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}