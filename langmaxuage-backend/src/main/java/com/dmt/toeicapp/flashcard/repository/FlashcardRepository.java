package com.dmt.toeicapp.flashcard.repository;

import com.dmt.toeicapp.flashcard.entity.Flashcard;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface FlashcardRepository extends JpaRepository<Flashcard, Long> {

    // Lấy tất cả flashcard user được thấy (từ system topic + personal topic của mình)
    // Hỗ trợ phân trang vì có thể nhiều card
    @Query("""
            SELECT f FROM Flashcard f
            WHERE f.active = true
              AND (f.topic.system = true OR f.topic.createdBy.id = :userId)
            ORDER BY f.createdAt DESC
            """)
    Page<Flashcard> findAccessibleByUser(@Param("userId") Long userId, Pageable pageable);

    // Lấy flashcard theo topic cụ thể (đã kiểm tra quyền truy cập topic ở Service)
    @Query("""
            SELECT f FROM Flashcard f
            WHERE f.active = true
              AND f.topic.id = :topicId
            ORDER BY f.createdAt DESC
            """)
    Page<Flashcard> findByTopicId(@Param("topicId") Long topicId, Pageable pageable);

    // Tìm flashcard active theo id — tránh lấy card đã bị soft delete
    Optional<Flashcard> findByIdAndActiveTrue(Long id);

    // Kiểm tra word trùng trong cùng một topic (tránh duplicate)
    boolean existsByWordAndTopicIdAndActiveTrue(String word, Long topicId);
}