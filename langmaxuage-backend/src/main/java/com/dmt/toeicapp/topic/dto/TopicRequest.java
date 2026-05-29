package com.dmt.toeicapp.topic.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// ── Request ───────────────────────────────────────────────────
// Dùng Java record — immutable, tự có constructor + getter, không cần Lombok
public record TopicRequest(

        @NotBlank(message = "Tên topic không được để trống")
        @Size(max = 100, message = "Tên topic tối đa 100 ký tự")
        String name,

        @Size(max = 1000, message = "Mô tả tối đa 1000 ký tự")
        String description,

        String iconUrl
) {}