package com.dmt.toeicapp.i18n.controller;

import com.dmt.toeicapp.common.response.ApiResponse;
import com.dmt.toeicapp.i18n.dto.*;
import com.dmt.toeicapp.i18n.service.I18nService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/i18n")
@RequiredArgsConstructor
public class I18nController {

    private final I18nService i18nService;

    // ── Locales — public ──────────────────────────────────────

    // Lấy danh sách ngôn ngữ đang active — không cần auth
    // Frontend dùng để render dropdown chọn ngôn ngữ
    @GetMapping("/locales")
    public ResponseEntity<ApiResponse<List<LocaleResponse>>> getActiveLocales() {
        return ResponseEntity.ok(ApiResponse.ok(i18nService.getActiveLocales()));
    }

    // ── Flashcard Translations ────────────────────────────────

    // Lấy tất cả bản dịch của 1 flashcard — user thường xem được
    @GetMapping("/flashcards/{flashcardId}/translations")
    public ResponseEntity<ApiResponse<List<FlashcardTranslationResponse>>> getFlashcardTranslations(
            @PathVariable Long flashcardId) {
        return ResponseEntity.ok(
                ApiResponse.ok(i18nService.getFlashcardTranslations(flashcardId))
        );
    }

    // Thêm/cập nhật bản dịch — chỉ ADMIN
    @PutMapping("/flashcards/{flashcardId}/translations")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<FlashcardTranslationResponse>> upsertFlashcardTranslation(
            @PathVariable Long flashcardId,
            @Valid @RequestBody FlashcardTranslationRequest request) {
        return ResponseEntity.ok(
                ApiResponse.ok(
                        i18nService.upsertFlashcardTranslation(flashcardId, request),
                        "Cập nhật bản dịch thành công"
                )
        );
    }

    // Xóa bản dịch theo locale — chỉ ADMIN
    @DeleteMapping("/flashcards/{flashcardId}/translations/{locale}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteFlashcardTranslation(
            @PathVariable Long flashcardId,
            @PathVariable String locale) {
        i18nService.deleteFlashcardTranslation(flashcardId, locale);
        return ResponseEntity.noContent().build();
    }

    // ── Topic Translations ────────────────────────────────────

    @GetMapping("/topics/{topicId}/translations")
    public ResponseEntity<ApiResponse<List<TopicTranslationResponse>>> getTopicTranslations(
            @PathVariable Long topicId) {
        return ResponseEntity.ok(
                ApiResponse.ok(i18nService.getTopicTranslations(topicId))
        );
    }

    @PutMapping("/topics/{topicId}/translations")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TopicTranslationResponse>> upsertTopicTranslation(
            @PathVariable Long topicId,
            @Valid @RequestBody TopicTranslationRequest request) {
        return ResponseEntity.ok(
                ApiResponse.ok(
                        i18nService.upsertTopicTranslation(topicId, request),
                        "Cập nhật bản dịch topic thành công"
                )
        );
    }

    @DeleteMapping("/topics/{topicId}/translations/{locale}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteTopicTranslation(
            @PathVariable Long topicId,
            @PathVariable String locale) {
        i18nService.deleteTopicTranslation(topicId, locale);
        return ResponseEntity.noContent().build();
    }
}