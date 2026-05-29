package com.dmt.toeicapp.progress.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

// ── ReviewRequest ─────────────────────────────────────────────
// User gửi lên sau mỗi lần review một flashcard
public record ReviewRequest(

        @NotNull(message = "Flashcard id không được để trống")
        Long flashcardId,

        @NotNull(message = "Quality không được để trống")
        @Min(value = 0, message = "Quality tối thiểu là 0")
        @Max(value = 5, message = "Quality tối đa là 5")
        Integer quality
        // 0 = hoàn toàn quên
        // 3 = đúng nhưng khó
        // 5 = dễ dàng
) {}