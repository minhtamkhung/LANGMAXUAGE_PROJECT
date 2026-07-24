package com.dmt.toeicapp.topic.repository;

import com.dmt.toeicapp.topic.entity.Topic;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TopicRepository extends JpaRepository<Topic, Long> {

    // Lấy tất cả topic user được thấy:
    // system topic (is_system = true) + personal topic của chính họ
    @Query("""
            SELECT t FROM Topic t
            WHERE t.system = true
               OR t.createdBy.id = :userId
            ORDER BY t.system DESC, t.displayOrder ASC, t.createdAt DESC
            """)
    List<Topic> findAccessibleByUser(@Param("userId") Long userId);

    @Query("""
            SELECT DISTINCT t FROM Topic t
            LEFT JOIN TopicTranslation trans ON trans.topic.id = t.id AND trans.locale = :locale
            WHERE (t.system = true OR t.createdBy.id = :userId)
              AND (
                   LOWER(t.name) LIKE :query
                   OR LOWER(t.description) LIKE :query
                   OR LOWER(trans.name) LIKE :query
                   OR LOWER(trans.description) LIKE :query
              )
              AND (
                   :filter = 'all'
                   OR (:filter = 'system' AND t.system = true)
                   OR (:filter = 'personal' AND t.system = false AND t.createdBy.id = :userId)
              )
            ORDER BY t.system DESC, t.displayOrder ASC, t.createdAt DESC
            """)
    Page<Topic> searchAccessibleByUser(
            @Param("userId") Long userId,
            @Param("query") String query,
            @Param("filter") String filter,
            @Param("locale") String locale,
            Pageable pageable);

    // Kiểm tra topic có thuộc về user không (dùng cho authorization)
    boolean existsByIdAndCreatedById(Long topicId, Long userId);

    // Kiểm tra tên topic trùng trong personal topics của user
    boolean existsByNameAndCreatedById(String name, Long userId);
}