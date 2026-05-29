package com.dmt.toeicapp.i18n.dto;

public record TopicTranslationResponse(
        Long   id,
        Long   topicId,
        String locale,
        String name,
        String description
) {}