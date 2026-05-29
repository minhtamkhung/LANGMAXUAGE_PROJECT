package com.dmt.toeicapp.quiz.entity;

import com.dmt.toeicapp.topic.entity.Topic;
import com.dmt.toeicapp.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "quiz_attempts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "topic_id")
    private Topic topic;

    @Enumerated(EnumType.STRING)
    @Column(name = "quiz_type", nullable = false, length = 30)
    @Builder.Default
    private QuizType quizType = QuizType.MULTIPLE_CHOICE;

    @Column(name = "total_questions", nullable = false)
    @Builder.Default
    private int totalQuestions = 0;

    @Column(name = "correct_answers", nullable = false)
    @Builder.Default
    private int correctAnswers = 0;

    @Column(nullable = false)
    @Builder.Default
    private int score = 0;

    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @Column(name = "started_at", nullable = false)
    @Builder.Default
    private OffsetDateTime startedAt = OffsetDateTime.now();

    @Column(name = "finished_at")
    private OffsetDateTime finishedAt;

    public enum QuizType {
        MULTIPLE_CHOICE, TRUE_FALSE, FILL_IN
    }
}