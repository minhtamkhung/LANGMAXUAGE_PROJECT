package com.dmt.toeicapp.i18n.service.impl;

import com.dmt.toeicapp.common.exception.AppException;
import com.dmt.toeicapp.common.security.SecurityUtils;
import com.dmt.toeicapp.flashcard.repository.FlashcardRepository;
import com.dmt.toeicapp.i18n.dto.*;
import com.dmt.toeicapp.i18n.entity.FlashcardTranslation;
import com.dmt.toeicapp.i18n.entity.TopicTranslation;
import com.dmt.toeicapp.i18n.repository.FlashcardTranslationRepository;
import com.dmt.toeicapp.i18n.repository.SupportedLocaleRepository;
import com.dmt.toeicapp.i18n.repository.TopicTranslationRepository;
import com.dmt.toeicapp.i18n.service.I18nService;
import com.dmt.toeicapp.topic.repository.TopicRepository;
import com.dmt.toeicapp.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class I18nServiceImpl implements I18nService {

    private final SupportedLocaleRepository       localeRepository;
    private final FlashcardTranslationRepository  flashcardTranslationRepository;
    private final TopicTranslationRepository      topicTranslationRepository;
    private final FlashcardRepository             flashcardRepository;
    private final TopicRepository                 topicRepository;
    private final UserRepository                  userRepository;

    // ── Locales ───────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<LocaleResponse> getActiveLocales() {
        return localeRepository.findByActiveTrueOrderByDisplayOrderAsc()
                .stream()
                .map(l -> new LocaleResponse(
                        l.getCode(),
                        l.getName(),
                        l.getNativeName(),
                        l.isDefaultLocale(),
                        l.isActive(),
                        l.getDisplayOrder()
                ))
                .toList();
    }

    // ── Flashcard Translations ────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<FlashcardTranslationResponse> getFlashcardTranslations(Long flashcardId) {
        validateFlashcardExists(flashcardId);
        return flashcardTranslationRepository.findByFlashcardId(flashcardId)
                .stream()
                .map(this::toFlashcardTranslationResponse)
                .toList();
    }

    @Override
    @Transactional
    public FlashcardTranslationResponse upsertFlashcardTranslation(Long flashcardId,
                                                                   FlashcardTranslationRequest req) {
        validateFlashcardExists(flashcardId);
        validateLocaleExists(req.locale());

        // Upsert — tìm existing hoặc tạo mới
        FlashcardTranslation translation = flashcardTranslationRepository
                .findByFlashcardIdAndLocale(flashcardId, req.locale())
                .orElseGet(() -> {
                    var card = flashcardRepository.getReferenceById(flashcardId);
                    var user = userRepository.getReferenceById(SecurityUtils.getCurrentUserId());
                    return FlashcardTranslation.builder()
                            .flashcard(card)
                            .locale(req.locale())
                            .createdBy(user)
                            .build();
                });

        translation.setDefinition(req.definition());
        translation.setExampleSentence(req.exampleSentence());

        log.info("Upsert flashcard translation: flashcardId={}, locale={}", flashcardId, req.locale());
        return toFlashcardTranslationResponse(flashcardTranslationRepository.save(translation));
    }

    @Override
    @Transactional
    public void deleteFlashcardTranslation(Long flashcardId, String locale) {
        FlashcardTranslation translation = flashcardTranslationRepository
                .findByFlashcardIdAndLocale(flashcardId, locale)
                .orElseThrow(() -> AppException.notFound(
                        "Không tìm thấy bản dịch cho flashcard " + flashcardId + " locale " + locale));
        flashcardTranslationRepository.delete(translation);
        log.info("Deleted flashcard translation: flashcardId={}, locale={}", flashcardId, locale);
    }

    // ── Topic Translations ────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<TopicTranslationResponse> getTopicTranslations(Long topicId) {
        validateTopicExists(topicId);
        return topicTranslationRepository.findByTopicId(topicId)
                .stream()
                .map(this::toTopicTranslationResponse)
                .toList();
    }

    @Override
    @Transactional
    public TopicTranslationResponse upsertTopicTranslation(Long topicId,
                                                           TopicTranslationRequest req) {
        validateTopicExists(topicId);
        validateLocaleExists(req.locale());

        TopicTranslation translation = topicTranslationRepository
                .findByTopicIdAndLocale(topicId, req.locale())
                .orElseGet(() -> {
                    var topic = topicRepository.getReferenceById(topicId);
                    return TopicTranslation.builder()
                            .topic(topic)
                            .locale(req.locale())
                            .build();
                });

        translation.setName(req.name());
        translation.setDescription(req.description());

        log.info("Upsert topic translation: topicId={}, locale={}", topicId, req.locale());
        return toTopicTranslationResponse(topicTranslationRepository.save(translation));
    }

    @Override
    @Transactional
    public void deleteTopicTranslation(Long topicId, String locale) {
        TopicTranslation translation = topicTranslationRepository
                .findByTopicIdAndLocale(topicId, locale)
                .orElseThrow(() -> AppException.notFound(
                        "Không tìm thấy bản dịch cho topic " + topicId + " locale " + locale));
        topicTranslationRepository.delete(translation);
    }

    // ── Private helpers ───────────────────────────────────────

    private void validateFlashcardExists(Long flashcardId) {
        if (!flashcardRepository.existsById(flashcardId)) {
            throw AppException.notFound("Không tìm thấy flashcard với id = " + flashcardId);
        }
    }

    private void validateTopicExists(Long topicId) {
        if (!topicRepository.existsById(topicId)) {
            throw AppException.notFound("Không tìm thấy topic với id = " + topicId);
        }
    }

    private void validateLocaleExists(String locale) {
        if (!localeRepository.existsById(locale)) {
            throw AppException.badRequest("Locale '" + locale + "' không được hỗ trợ", "LOCALE_NOT_SUPPORTED");
        }
    }

    private FlashcardTranslationResponse toFlashcardTranslationResponse(FlashcardTranslation t) {
        return new FlashcardTranslationResponse(
                t.getId(),
                t.getFlashcard().getId(),
                t.getLocale(),
                t.getDefinition(),
                t.getExampleSentence()
        );
    }

    private TopicTranslationResponse toTopicTranslationResponse(TopicTranslation t) {
        return new TopicTranslationResponse(
                t.getId(),
                t.getTopic().getId(),
                t.getLocale(),
                t.getName(),
                t.getDescription()
        );
    }
}