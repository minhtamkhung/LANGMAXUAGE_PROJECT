package com.dmt.toeicapp.i18n.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TopicTranslationRequest(
        @NotBlank(message = "Locale không được để trống")
        String locale,

        @NotBlank(message = "Tên topic không được để trống")
        @Size(min = 2, max = 100, message = "Tên topic từ 2 đến 100 ký tự")
        String name,

        String description
) {}