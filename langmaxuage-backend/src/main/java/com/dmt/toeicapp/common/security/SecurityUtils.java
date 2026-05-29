package com.dmt.toeicapp.common.security;

import com.dmt.toeicapp.user.entity.User;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

// Utility class — không phải Spring bean, chỉ gọi static
// Dùng để lấy thông tin user đang đăng nhập từ bất kỳ đâu trong app
public final class SecurityUtils {

    private SecurityUtils() {} // prevent instantiation

    public static Long getCurrentUserId() {
        return getCurrentUser().getId();
    }

    public static String getCurrentUsername() {
        return getCurrentUser().getUsername();
    }

    public static boolean isAdmin() {
        return getCurrentUser().getRole() == User.Role.ADMIN;
    }

    // Trả về User entity đang đăng nhập
    // Principal được set bởi JwtAuthFilter sau khi validate token
    public static User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new IllegalStateException("Không tìm thấy user trong SecurityContext");
        }
        // Principal sẽ là User entity — được set trong JwtAuthFilter
        return (User) auth.getPrincipal();
    }
}