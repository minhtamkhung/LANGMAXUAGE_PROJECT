package com.dmt.toeicapp.quiz.repository;

import com.dmt.toeicapp.quiz.entity.QuizAnswer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuizAnswerRepository extends JpaRepository<QuizAnswer, Long> {

    // Lấy tất cả câu trả lời trong một attempt
    List<QuizAnswer> findByAttemptId(Long attemptId);

    // Chỉ lấy câu sai — dùng cho review
    List<QuizAnswer> findByAttemptIdAndIsCorrectFalse(Long attemptId);
}