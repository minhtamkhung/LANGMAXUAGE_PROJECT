package com.dmt.toeicapp.i18n.repository;

import com.dmt.toeicapp.i18n.entity.TopicTranslation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TopicTranslationRepository extends JpaRepository<TopicTranslation, Long> {

    Optional<TopicTranslation> findByTopicIdAndLocale(Long topicId, String locale);

    List<TopicTranslation> findByTopicId(Long topicId);

    // Batch load cho danh sách topics — tránh N+1
    @Query("""
            SELECT t FROM TopicTranslation t
            WHERE t.topic.id IN :topicIds
              AND t.locale = :locale
            """)
    List<TopicTranslation> findByTopicIdsAndLocale(
            @Param("topicIds") List<Long> topicIds,
            @Param("locale") String locale
    );

    boolean existsByTopicIdAndLocale(Long topicId, String locale);
}