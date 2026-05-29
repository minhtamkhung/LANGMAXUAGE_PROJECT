package com.dmt.toeicapp.i18n.repository;

import com.dmt.toeicapp.i18n.entity.FlashcardTranslation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FlashcardTranslationRepository extends JpaRepository<FlashcardTranslation, Long> {

    Optional<FlashcardTranslation> findByFlashcardIdAndLocale(Long flashcardId, String locale);

    List<FlashcardTranslation> findByFlashcardId(Long flashcardId);

    // Batch load theo 1 locale — dùng khi danh sách, không cần toggle
    @Query("""
            SELECT t FROM FlashcardTranslation t
            WHERE t.flashcard.id IN :flashcardIds
              AND t.locale = :locale
            """)
    List<FlashcardTranslation> findByFlashcardIdsAndLocale(
            @Param("flashcardIds") List<Long> flashcardIds,
            @Param("locale") String locale
    );

    // Batch load TẤT CẢ locale của nhiều card — dùng khi includeAllLocales=true
    // Frontend nhận về map đầy đủ, toggle EN↔VI↔JA hoàn toàn client-side
    @Query("""
            SELECT t FROM FlashcardTranslation t
            WHERE t.flashcard.id IN :flashcardIds
            """)
    List<FlashcardTranslation> findAllByFlashcardIds(
            @Param("flashcardIds") List<Long> flashcardIds
    );

    boolean existsByFlashcardIdAndLocale(Long flashcardId, String locale);

    void deleteByFlashcardId(Long flashcardId);
}