package com.dmt.toeicapp.user.dto;

import java.time.OffsetDateTime;

public record UserResponse(
        Long           id,
        String         username,
        String         email,
        String         role,
        String         avatarUrl,
        boolean        isActive,
        OffsetDateTime createdAt
) {}