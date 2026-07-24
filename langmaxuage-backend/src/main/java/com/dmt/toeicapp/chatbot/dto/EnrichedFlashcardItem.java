package com.dmt.toeicapp.chatbot.dto;

import com.dmt.toeicapp.external.dictionary.WordEnrichmentResult;

/**
 * Đóng gói kết quả AI gen 1 flashcard + kết quả enrich từ Dictionary API.
 * Dùng làm đối tượng trung gian trước khi lưu DB trong persistence layer.
 */
public record EnrichedFlashcardItem(
        AiMultiLangTopicResponse.AiMultiLangFlashcardItem cardItem,
        WordEnrichmentResult enrichment
) {}
