package com.dmt.toeicapp.topic.repository;

import com.dmt.toeicapp.topic.entity.Topic;
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

    // Kiểm tra topic có thuộc về user không (dùng cho authorization)
    boolean existsByIdAndCreatedById(Long topicId, Long userId);

    // Kiểm tra tên topic trùng trong personal topics của user
    boolean existsByNameAndCreatedById(String name, Long userId);
}