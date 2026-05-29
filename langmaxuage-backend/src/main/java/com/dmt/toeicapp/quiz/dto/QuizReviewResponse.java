package com.dmt.toeicapp.quiz.dto;

import java.util.List;

public record QuizReviewResponse(
        Long           attemptId,
        int            totalQuestions,
        int            correctAnswers,
        int            score,
        List<WrongAnswerDetail> wrongAnswers
) {
    public record WrongAnswerDetail(
            Long   flashcardId,
            String word,
            String definition,
            String yourAnswer,
            String correctAnswer
    ) {}
}