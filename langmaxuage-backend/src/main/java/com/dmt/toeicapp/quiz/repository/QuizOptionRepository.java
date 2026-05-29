package com.dmt.toeicapp.quiz.repository;

import com.dmt.toeicapp.quiz.entity.QuizOption;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuizOptionRepository extends JpaRepository<QuizOption, Long> {
}