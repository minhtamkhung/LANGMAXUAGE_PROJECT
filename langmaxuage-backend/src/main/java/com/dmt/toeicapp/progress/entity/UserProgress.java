package com.dmt.toeicapp.progress.entity;

import com.dmt.toeicapp.flashcard.entity.Flashcard;
import com.dmt.toeicapp.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "user_progress",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "flashcard_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "flashcard_id", nullable = false)
    private Flashcard flashcard;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Status status = Status.NEW;

    @Column(name = "review_count", nullable = false)
    @Builder.Default
    private int reviewCount = 0;

    @Column(name = "correct_count", nullable = false)
    @Builder.Default
    private int correctCount = 0;

    // SM-2 fields
    @Column(name = "easiness_factor", nullable = false)
    @Builder.Default
    private BigDecimal easinessFactor = new BigDecimal("2.50");

    @Column(name = "interval_days", nullable = false)
    @Builder.Default
    private int intervalDays = 1;

    @Column(name = "sm2_repetitions", nullable = false)
    @Builder.Default
    private int sm2Repetitions = 0;

    @Column(name = "last_reviewed_at")
    private OffsetDateTime lastReviewedAt;

    @Column(name = "next_review_at", nullable = false)
    @Builder.Default
    private OffsetDateTime nextReviewAt = OffsetDateTime.now();

    public enum Status {
        NEW, LEARNING, REVIEWING, MASTERED
    }
}