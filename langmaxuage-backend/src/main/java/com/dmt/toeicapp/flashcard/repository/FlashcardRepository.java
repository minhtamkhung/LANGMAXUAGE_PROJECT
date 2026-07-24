package com.dmt.toeicapp.flashcard.repository;

import com.dmt.toeicapp.flashcard.entity.Flashcard;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FlashcardRepository extends JpaRepository<Flashcard, Long> {

    // Lấy tất cả flashcard user được thấy (từ system topic + personal topic của mình)
    // Hỗ trợ phân trang vì có thể nhiều card
    @Query("""
            SELECT f FROM Flashcard f
            WHERE f.active = true
              AND (f.createdBy.id = :userId OR f.createdBy.role = com.dmt.toeicapp.user.entity.User.Role.ADMIN)
              AND (f.topic.system = true OR f.topic.createdBy.id = :userId)
            ORDER BY f.createdAt DESC
            """)
    Page<Flashcard> findAccessibleByUser(@Param("userId") Long userId, Pageable pageable);

    // Lấy flashcard theo topic cụ thể (đã kiểm tra quyền truy cập topic ở Service)
    @Query("""
            SELECT f FROM Flashcard f
            WHERE f.active = true
              AND f.topic.id = :topicId
              AND (f.createdBy.id = :userId OR f.createdBy.role = com.dmt.toeicapp.user.entity.User.Role.ADMIN)
            ORDER BY f.createdAt DESC
            """)
    Page<Flashcard> findByTopicId(@Param("topicId") Long topicId, @Param("userId") Long userId, Pageable pageable);

    // Tìm flashcard active theo id — tránh lấy card đã bị soft delete
    Optional<Flashcard> findByIdAndActiveTrue(Long id);

    List<Flashcard> findByTopicIdAndActiveTrue(Long topicId);

    // Kiểm tra word trùng trong cùng một topic (tránh duplicate)
    boolean existsByWordAndTopicIdAndActiveTrue(String word, Long topicId);

    @Query("""
            SELECT COUNT(f) > 0 FROM Flashcard f
            WHERE f.active = true
              AND f.topic.id = :topicId
              AND LOWER(f.word) = LOWER(:word)
              AND (f.createdBy.id = :userId OR f.createdBy.role = com.dmt.toeicapp.user.entity.User.Role.ADMIN)
            """)
    boolean existsByWordAndTopicIdAndUser(@Param("word") String word, @Param("topicId") Long topicId, @Param("userId") Long userId);

    @Query("""
            SELECT COUNT(f) FROM Flashcard f
            WHERE f.active = true
              AND f.topic.id = :topicId
              AND (f.createdBy.id = :userId OR f.createdBy.role = com.dmt.toeicapp.user.entity.User.Role.ADMIN)
            """)
    long countByTopicId(@Param("topicId") Long topicId, @Param("userId") Long userId);

    // ── JOIN FETCH queries — load relatedWords kèm để tránh N+1 ──

    @Query("""
            SELECT DISTINCT f FROM Flashcard f
            LEFT JOIN FETCH f.relatedWords
            WHERE f.active = true
              AND f.id IN :ids
            """)
    List<Flashcard> findWithRelatedWordsByIds(@Param("ids") List<Long> ids);

    @Query("""
            SELECT f FROM Flashcard f
            LEFT JOIN FETCH f.relatedWords
            WHERE f.id = :id
              AND f.active = true
            """)
    Optional<Flashcard> findByIdWithRelatedWords(@Param("id") Long id);
}