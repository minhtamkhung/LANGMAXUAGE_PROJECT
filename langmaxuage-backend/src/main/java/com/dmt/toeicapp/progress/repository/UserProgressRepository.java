package com.dmt.toeicapp.progress.repository;

import com.dmt.toeicapp.progress.entity.UserProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

public interface UserProgressRepository extends JpaRepository<UserProgress, Long> {

    // Lấy progress của user cho một flashcard cụ thể
    Optional<UserProgress> findByUserIdAndFlashcardId(Long userId, Long flashcardId);

    // Lấy tất cả progress của user
    List<UserProgress> findByUserId(Long userId);

    // Lấy danh sách card cần ôn hôm nay (SM-2)
    // next_review_at <= now → đến lịch rồi
    @Query("""
            SELECT p FROM UserProgress p
            WHERE p.user.id = :userId
              AND p.nextReviewAt <= :now
              AND p.flashcard.active = true
            ORDER BY p.nextReviewAt ASC
            """)
    List<UserProgress> findDueForReview(@Param("userId") Long userId,
                                        @Param("now") OffsetDateTime now);

    // Đếm số card theo status — dùng cho dashboard
    @Query("""
            SELECT COUNT(p) FROM UserProgress p
            WHERE p.user.id = :userId
              AND p.status = :status
            """)
    long countByUserIdAndStatus(@Param("userId") Long userId,
                                @Param("status") com.dmt.toeicapp.progress.entity.UserProgress.Status status);
}