package com.dmt.toeicapp.chatbot.service;

import com.dmt.toeicapp.chatbot.dto.AiMultiLangTopicResponse;
import com.dmt.toeicapp.chatbot.dto.EnrichedFlashcardItem;
import com.dmt.toeicapp.topic.dto.TopicResponse;
import com.dmt.toeicapp.user.entity.User;

import java.util.List;

/**
 * Chịu trách nhiệm duy nhất: lưu toàn bộ dữ liệu Topic + Flashcards sinh bởi AI vào DB.
 * Tách biệt khỏi tầng gọi API ngoài (Gemini, Dictionary) để tránh giữ DB connection
 * trong thời gian chờ các API này phản hồi.
 */
public interface AiTopicPersistenceService {

    /**
     * Lưu topic, các bản dịch topic, flashcards, và bản dịch flashcards vào DB.
     * Đăng ký Datamuse enrichment chạy nền sau khi transaction commit.
     *
     * @param owner        User sở hữu topic (đã được load trước đó)
     * @param aiResponse   Toàn bộ response từ Gemini AI
     * @param enrichedItems Danh sách flashcard đã được enrich từ Dictionary API
     * @return TopicResponse của topic vừa tạo
     */
    TopicResponse saveAll(User owner,
                          AiMultiLangTopicResponse aiResponse,
                          List<EnrichedFlashcardItem> enrichedItems);
}
