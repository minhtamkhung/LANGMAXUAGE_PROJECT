package com.dmt.toeicapp.quiz.service;

import com.dmt.toeicapp.quiz.dto.*;
import java.util.List;

public interface QuizService {
    // Thêm tham số locale để xác định ngôn ngữ của định nghĩa trong câu hỏi
    QuizAttemptSummary start(QuizStartRequest request, String locale);

    QuizAnswerResponse answer(Long attemptId, QuizAnswerRequest request, String locale);
    QuizAttemptSummary finish(Long attemptId);
    List<QuizAttemptSummary> getHistory();
    QuizReviewResponse review(Long attemptId);
}