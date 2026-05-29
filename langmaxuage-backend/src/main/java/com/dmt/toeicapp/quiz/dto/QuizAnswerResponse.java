package com.dmt.toeicapp.quiz.dto;

public record QuizAnswerResponse(
        Long    flashcardId,
        String  selectedAnswer,
        String  correctAnswer,  // trả về sau khi submit để frontend hiện đáp án đúng
        boolean isCorrect
) {}