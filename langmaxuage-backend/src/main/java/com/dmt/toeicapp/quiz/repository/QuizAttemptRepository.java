package com.dmt.toeicapp.quiz.repository;

import com.dmt.toeicapp.quiz.entity.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {

    // Lịch sử quiz của user — mới nhất trước
    List<QuizAttempt> findByUserIdOrderByStartedAtDesc(Long userId);

    // Lấy attempt của user (kiểm tra ownership)
    Optional<QuizAttempt> findByIdAndUserId(Long id, Long userId);
}