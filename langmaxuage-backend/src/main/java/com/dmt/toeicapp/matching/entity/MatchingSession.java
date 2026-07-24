package com.dmt.toeicapp.matching.entity;

import com.dmt.toeicapp.topic.entity.Topic;
import com.dmt.toeicapp.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "matching_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MatchingSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "topic_id")
    private Topic topic;

    @Column(name = "total_pairs", nullable = false)
    @Builder.Default
    private int totalPairs = 0;

    @Column(name = "correct_pairs", nullable = false)
    @Builder.Default
    private int correctPairs = 0;

    @Column(nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal accuracy = BigDecimal.ZERO;

    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @Column(name = "started_at", nullable = false)
    @Builder.Default
    private OffsetDateTime startedAt = OffsetDateTime.now();

    @Column(name = "finished_at")
    private OffsetDateTime finishedAt;
}
