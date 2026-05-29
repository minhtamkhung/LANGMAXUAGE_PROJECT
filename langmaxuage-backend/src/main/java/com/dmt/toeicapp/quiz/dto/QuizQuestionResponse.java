package com.dmt.toeicapp.quiz.dto;

import java.util.List;

public record QuizQuestionResponse(
        Long         flashcardId,
        String       word,
        String       pronunciation,
        List<String> options    // 4 đáp án đã shuffle, không đánh dấu đúng/sai
) {}