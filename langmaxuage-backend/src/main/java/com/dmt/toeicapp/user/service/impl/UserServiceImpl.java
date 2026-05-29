package com.dmt.toeicapp.user.service.impl;

import com.dmt.toeicapp.common.exception.AppException;
import com.dmt.toeicapp.common.security.SecurityUtils;
import com.dmt.toeicapp.user.dto.UpdateProfileRequest;
import com.dmt.toeicapp.user.dto.UserResponse;
import com.dmt.toeicapp.user.entity.User;
import com.dmt.toeicapp.user.mapper.UserMapper;
import com.dmt.toeicapp.user.repository.UserRepository;
import com.dmt.toeicapp.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository  userRepository;
    private final UserMapper      userMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public UserResponse getMe() {
        User user = SecurityUtils.getCurrentUser();
        return userMapper.toResponse(user);
    }

    @Override
    @Transactional
    public UserResponse updateMe(UpdateProfileRequest request) {
        User user = SecurityUtils.getCurrentUser();

        // Reload từ DB để có entity managed (SecurityContext giữ detached entity)
        user = userRepository.findById(user.getId())
                .orElseThrow(() -> AppException.notFound("Không tìm thấy user"));

        // Kiểm tra username trùng nếu có thay đổi
        if (request.username() != null
                && !request.username().equals(user.getUsername())
                && userRepository.existsByUsername(request.username())) {
            throw AppException.conflict("Username đã được sử dụng", "USERNAME_ALREADY_EXISTS");
        }

        if (request.username() != null) {
            user.setUsername(request.username());
        }
        if (request.avatarUrl() != null) {
            user.setAvatarUrl(request.avatarUrl());
        }

        return userMapper.toResponse(userRepository.save(user));
    }

    @Override
    @Transactional
    public void changePassword(String oldPassword, String newPassword) {
        User user = SecurityUtils.getCurrentUser();

        // Reload từ DB
        user = userRepository.findById(user.getId())
                .orElseThrow(() -> AppException.notFound("Không tìm thấy user"));

        // Kiểm tra mật khẩu cũ
        if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
            throw AppException.badRequest("Mật khẩu cũ không đúng", "WRONG_OLD_PASSWORD");
        }

        // Kiểm tra mật khẩu mới không trùng mật khẩu cũ
        if (passwordEncoder.matches(newPassword, user.getPasswordHash())) {
            throw AppException.badRequest(
                    "Mật khẩu mới không được trùng mật khẩu cũ", "SAME_PASSWORD");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}