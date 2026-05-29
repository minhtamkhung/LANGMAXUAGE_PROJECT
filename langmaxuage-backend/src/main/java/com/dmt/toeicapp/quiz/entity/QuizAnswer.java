package com.dmt.toeicapp.quiz.entity;

import com.dmt.toeicapp.flashcard.entity.Flashcard;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "quiz_answers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attempt_id", nullable = false)
    private QuizAttempt attempt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "flashcard_id", nullable = false)
    private Flashcard flashcard;

    @Column(name = "selected_answer", length = 500)
    private String selectedAnswer;

    @Column(name = "correct_answer", nullable = false, columnDefinition = "TEXT")
    private String correctAnswer;

    @Column(name = "is_correct", nullable = false)
    @Builder.Default
    private boolean isCorrect = false;

    @Column(name = "time_spent_seconds")
    private Integer timeSpentSeconds;
}