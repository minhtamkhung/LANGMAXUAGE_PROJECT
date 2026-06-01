package com.dmt.toeicapp.chatbot.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record AiMultiLangTopicResponse(
        @JsonProperty("topicTranslations") List<TopicTranslationItem> topicTranslations,
        @JsonProperty("flashcards") List<AiMultiLangFlashcardItem> flashcards
) {
    public record TopicTranslationItem(
            @JsonProperty("locale") String locale,
            @JsonProperty("name") String name,
            @JsonProperty("description") String description
    ) {}

    public record AiMultiLangFlashcardItem(
            @JsonProperty("word") String word,
            @JsonProperty("pronunciation") String pronunciation,
            @JsonProperty("flashcardTranslations") List<FlashcardTranslationItem> flashcardTranslations
    ) {}

    public record FlashcardTranslationItem(
            @JsonProperty("locale") String locale,
            @JsonProperty("definition") String definition,
            @JsonProperty("exampleSentence") String exampleSentence
    ) {}
}
