package com.dmt.toeicapp.quiz.dto;

import jakarta.validation.constraints.NotNull;

// ── QuizStartRequest ──────────────────────────────────────────
// User chọn topic và số câu muốn quiz
public record QuizStartRequest(

        @NotNull(message = "Topic không được để trống")
        Long topicId,

        // Số câu hỏi — mặc định 10 nếu không truyền
        Integer questionCount
) {
    public QuizStartRequest {
        if (questionCount == null) questionCount = 10;
        if (questionCount < 1)    questionCount = 1;
        if (questionCount > 50)   questionCount = 50;
    }
}