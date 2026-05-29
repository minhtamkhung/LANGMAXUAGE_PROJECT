package com.dmt.toeicapp.user.dto;

import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(

        @Size(min = 3, max = 50, message = "Username từ 3 đến 50 ký tự")
        String username,

        // avatarUrl do Cloudinary trả về sau khi upload ảnh
        String avatarUrl
) {}