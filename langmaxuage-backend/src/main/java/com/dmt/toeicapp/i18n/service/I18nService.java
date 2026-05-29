package com.dmt.toeicapp.i18n.service;

import com.dmt.toeicapp.i18n.dto.*;

import java.util.List;

public interface I18nService {

    // ── Locales ───────────────────────────────────────────────
    // Lấy danh sách ngôn ngữ đang active — dùng cho dropdown UI
    List<LocaleResponse> getActiveLocales();

    // ── Flashcard Translations ────────────────────────────────
    // Lấy tất cả bản dịch của 1 flashcard — dùng cho admin
    List<FlashcardTranslationResponse> getFlashcardTranslations(Long flashcardId);

    // Thêm hoặc cập nhật bản dịch — upsert theo flashcard_id + locale
    FlashcardTranslationResponse upsertFlashcardTranslation(Long flashcardId,
                                                            FlashcardTranslationRequest request);

    // Xóa bản dịch theo locale
    void deleteFlashcardTranslation(Long flashcardId, String locale);

    // ── Topic Translations ────────────────────────────────────
    List<TopicTranslationResponse> getTopicTranslations(Long topicId);

    TopicTranslationResponse upsertTopicTranslation(Long topicId,
                                                    TopicTranslationRequest request);

    void deleteTopicTranslation(Long topicId, String locale);
}