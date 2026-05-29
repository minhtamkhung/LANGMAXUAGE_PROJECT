package com.dmt.toeicapp.topic.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.OffsetDateTime;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record TopicResponse(
        Long           id,

        // Tên gốc tiếng Anh — luôn có
        String         name,
        String         description,

        // i18n — chỉ có khi locale != 'en' và có bản dịch
        String         locale,
        String         translatedName,
        String         translatedDescription,

        String         iconUrl,
        int            displayOrder,

        @JsonProperty("isSystem")
        boolean        isSystem,

        Long           createdById,
        String         createdByUsername,
        OffsetDateTime createdAt
) {}