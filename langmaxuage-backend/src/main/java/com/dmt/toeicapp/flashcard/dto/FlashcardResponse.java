package com.dmt.toeicapp.flashcard.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.OffsetDateTime;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record FlashcardResponse(
        Long           id,
        Long           topicId,
        String         topicName,
        String         word,
        String         pronunciation,

        // Nội dung gốc tiếng Anh — luôn có, dùng làm fallback
        String         definition,
        String         exampleSentence,

        String         difficulty,
        String         imageUrl,

        // i18n — ngôn ngữ chính được chọn
        String         primaryLocale,
        String         primaryDefinition,      // definition theo primaryLocale
        String         primaryExample,         // example theo primaryLocale

        // Tất cả bản dịch — chỉ có khi includeAllLocales=true
        // Map<locale, TranslationContent> — frontend toggle client-side, zero latency
        Map<String, TranslationContent> translations,

        Long           createdById,
        String         createdByUsername,
        OffsetDateTime createdAt
) {
    // Record lồng — content của 1 bản dịch
    public record TranslationContent(
            String definition,
            String exampleSentence
    ) {}
}