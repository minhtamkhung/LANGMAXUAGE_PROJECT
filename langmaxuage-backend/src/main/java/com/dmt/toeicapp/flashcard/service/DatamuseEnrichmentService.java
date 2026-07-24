package com.dmt.toeicapp.flashcard.service;

public interface DatamuseEnrichmentService {
    void enrichRelatedWordsAsync(Long flashcardId, String word);
}
