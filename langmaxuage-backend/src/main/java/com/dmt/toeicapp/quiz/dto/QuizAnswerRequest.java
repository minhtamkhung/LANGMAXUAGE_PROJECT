package com.dmt.toeicapp.quiz.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

// ── QuizAnswerRequest ─────────────────────────────────────────
// User submit đáp án cho 1 câu
public record QuizAnswerRequest(

        @NotNull(message = "Flashcard không được để trống")
        Long flashcardId,

        @NotBlank(message = "Đáp án không được để trống")
        String selectedAnswer,

        // Thời gian làm câu này (giây) — optional
        Integer timeSpentSeconds
) {}