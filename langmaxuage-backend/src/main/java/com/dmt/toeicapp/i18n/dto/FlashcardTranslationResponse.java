package com.dmt.toeicapp.i18n.dto;

public record FlashcardTranslationResponse(
        Long   id,
        Long   flashcardId,
        String locale,
        String definition,
        String exampleSentence
) {}