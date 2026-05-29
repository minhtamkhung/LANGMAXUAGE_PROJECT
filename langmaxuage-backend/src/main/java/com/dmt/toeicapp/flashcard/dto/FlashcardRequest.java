package com.dmt.toeicapp.flashcard.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

// ── Request ───────────────────────────────────────────────────
public record FlashcardRequest(

        @NotNull(message = "Topic không được để trống")
        Long topicId,

        @NotBlank(message = "Từ không được để trống")
        @Size(max = 200, message = "Từ tối đa 200 ký tự")
        String word,

        @Size(max = 200, message = "Phiên âm tối đa 200 ký tự")
        String pronunciation,

        @NotBlank(message = "Định nghĩa không được để trống")
        String definition,

        String exampleSentence,

        @Pattern(
                regexp = "EASY|MEDIUM|HARD",
                message = "Độ khó phải là EASY, MEDIUM hoặc HARD"
        )
        String difficulty
) {}