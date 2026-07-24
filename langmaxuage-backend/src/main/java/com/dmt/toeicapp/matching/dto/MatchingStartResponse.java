package com.dmt.toeicapp.matching.dto;

import java.util.List;

public record MatchingStartResponse(
        Long sessionId,
        Long topicId,
        String topicName,
        List<WordItem> words,
        List<DefinitionItem> definitions
) {
    public record WordItem(
            Long id,
            String word,
            String pronunciation
    ) {}

    public record DefinitionItem(
            Long flashcardId,
            String text
    ) {}
}
