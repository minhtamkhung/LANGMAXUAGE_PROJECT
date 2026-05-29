package com.dmt.toeicapp.common.security;

import com.dmt.toeicapp.user.entity.User;
import com.dmt.toeicapp.user.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil        jwtUtil;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String token = extractToken(request);

        if (token != null && jwtUtil.isValid(token) && jwtUtil.isAccessToken(token)) {
            Long userId = jwtUtil.extractUserId(token);

            userRepository.findById(userId).ifPresent(user -> {
                if (user.isActive()) {
                    setAuthentication(user, request);
                }
            });
        }

        filterChain.doFilter(request, response);
    }

    // ── Private helpers ───────────────────────────────────────

    // Set User entity làm principal — SecurityUtils.getCurrentUser() sẽ cast về User
    private void setAuthentication(User user, HttpServletRequest request) {
        var authorities = List.of(
                new SimpleGrantedAuthority("ROLE_" + user.getRole().name())
        );

        var authToken = new UsernamePasswordAuthenticationToken(
                user,        // principal = User entity (không phải UserDetails)
                null,        // credentials = null sau khi đã xác thực
                authorities
        );
        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authToken);
    }

    // Đọc token từ header: "Authorization: Bearer <token>"
    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (StringUtils.hasText(header) && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }
}