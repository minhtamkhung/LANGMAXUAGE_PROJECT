package com.dmt.toeicapp.progress.dto;

import com.dmt.toeicapp.flashcard.dto.FlashcardResponse;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record ProgressResponse(
        Long              id,
        FlashcardResponse flashcard,    // Chứa đầy đủ word, definition, translations...
        String            status,
        int               reviewCount,
        int               correctCount,
        BigDecimal        easinessFactor,
        int               intervalDays,
        int               sm2Repetitions,
        OffsetDateTime    lastReviewedAt,
        OffsetDateTime    nextReviewAt
) {}