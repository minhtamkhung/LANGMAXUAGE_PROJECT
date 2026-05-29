package com.dmt.toeicapp.quiz.dto;

import java.time.OffsetDateTime;
import java.util.List;

public record QuizAttemptSummary(
        Long           attemptId,
        Long           topicId,
        String         topicName,
        String         quizType,
        int            totalQuestions,
        int            correctAnswers,
        int            score,
        Integer        durationSeconds,
        OffsetDateTime startedAt,
        OffsetDateTime finishedAt,
        List<QuizQuestionResponse> questions
) {}