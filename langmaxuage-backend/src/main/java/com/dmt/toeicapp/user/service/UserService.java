package com.dmt.toeicapp.user.service;

import com.dmt.toeicapp.user.dto.UpdateProfileRequest;
import com.dmt.toeicapp.user.dto.UserResponse;

public interface UserService {

    // Lấy thông tin user đang đăng nhập
    UserResponse getMe();

    // Cập nhật username và avatarUrl
    UserResponse updateMe(UpdateProfileRequest request);

    // Đổi mật khẩu
    void changePassword(String oldPassword, String newPassword);
}