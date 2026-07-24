package com.dmt.toeicapp.flashcard.repository;

import com.dmt.toeicapp.flashcard.entity.FlashcardRelatedWord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FlashcardRelatedWordRepository extends JpaRepository<FlashcardRelatedWord, Long> {
    List<FlashcardRelatedWord> findByFlashcardId(Long flashcardId);
}
