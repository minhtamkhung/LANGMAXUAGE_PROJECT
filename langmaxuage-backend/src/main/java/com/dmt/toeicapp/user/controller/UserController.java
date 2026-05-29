package com.dmt.toeicapp.user.controller;

import com.dmt.toeicapp.common.response.ApiResponse;
import com.dmt.toeicapp.user.dto.ChangePasswordRequest;
import com.dmt.toeicapp.user.dto.UpdateProfileRequest;
import com.dmt.toeicapp.user.dto.UserResponse;
import com.dmt.toeicapp.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // Lấy thông tin bản thân
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getMe() {
        return ResponseEntity.ok(
                ApiResponse.ok(userService.getMe()));
    }

    // Cập nhật profile
    @PatchMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> updateMe(
            @Valid @RequestBody UpdateProfileRequest request) {
        System.out.println("🔥 HIT UPDATE PROFILE");
        return ResponseEntity.ok(
                ApiResponse.ok(userService.updateMe(request), "Cập nhật profile thành công"));
    }

    // Đổi mật khẩu
    @PatchMapping("/me/password")
    public ResponseEntity<Void> changePassword(
            @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(request.oldPassword(), request.newPassword());
        return ResponseEntity.noContent().build(); // 204
    }
}