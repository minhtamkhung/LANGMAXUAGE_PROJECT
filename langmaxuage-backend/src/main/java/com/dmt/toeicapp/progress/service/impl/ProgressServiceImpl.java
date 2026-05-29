package com.dmt.toeicapp.progress.service.impl;

import com.dmt.toeicapp.common.exception.AppException;
import com.dmt.toeicapp.common.security.SecurityUtils;
import com.dmt.toeicapp.common.util.SM2Algorithm;
import com.dmt.toeicapp.flashcard.dto.FlashcardResponse;
import com.dmt.toeicapp.flashcard.entity.Flashcard;
import com.dmt.toeicapp.flashcard.mapper.FlashcardMapper;
import com.dmt.toeicapp.flashcard.repository.FlashcardRepository;
import com.dmt.toeicapp.i18n.entity.FlashcardTranslation;
import com.dmt.toeicapp.i18n.repository.FlashcardTranslationRepository;
import com.dmt.toeicapp.progress.dto.ProgressResponse;
import com.dmt.toeicapp.progress.dto.ReviewRequest;
import com.dmt.toeicapp.progress.entity.UserProgress;
import com.dmt.toeicapp.progress.mapper.ProgressMapper;
import com.dmt.toeicapp.progress.repository.UserProgressRepository;
import com.dmt.toeicapp.progress.service.ProgressService;
import com.dmt.toeicapp.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProgressServiceImpl implements ProgressService {

    private final UserProgressRepository         progressRepository;
    private final FlashcardRepository            flashcardRepository;
    private final FlashcardTranslationRepository translationRepository;
    private final UserRepository                 userRepository;
    private final ProgressMapper                 progressMapper;
    private final FlashcardMapper                flashcardMapper;

    private static final String DEFAULT_LOCALE = "en";

    @Override
    @Transactional(readOnly = true)
    public List<ProgressResponse> getMyProgress(String locale) {
        Long userId = SecurityUtils.getCurrentUserId();
        List<UserProgress> list = progressRepository.findByUserId(userId);
        return enrichWithTranslations(list, locale);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProgressResponse> getDueCards(String locale) {
        Long userId = SecurityUtils.getCurrentUserId();
        List<UserProgress> list = progressRepository.findDueForReview(userId, OffsetDateTime.now());
        return enrichWithTranslations(list, locale);
    }

    @Override
    @Transactional
    public ProgressResponse review(ReviewRequest request, String locale) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        Flashcard flashcard = flashcardRepository.findByIdAndActiveTrue(request.flashcardId())
                .orElseThrow(() -> AppException.notFound("Không tìm thấy flashcard"));

        UserProgress progress = progressRepository.findByUserIdAndFlashcardId(currentUserId, request.flashcardId())
                .orElseGet(() -> UserProgress.builder()
                        .user(userRepository.getReferenceById(currentUserId))
                        .flashcard(flashcard).build());

        SM2Algorithm.Result result = SM2Algorithm.calculate(
                request.quality(), progress.getSm2Repetitions(),
                progress.getEasinessFactor(), progress.getIntervalDays());

        progress.setReviewCount(progress.getReviewCount() + 1);
        progress.setLastReviewedAt(OffsetDateTime.now());
        progress.setSm2Repetitions(result.newRepetitions());
        progress.setEasinessFactor(result.newEasinessFactor());
        progress.setIntervalDays(result.newIntervalDays());
        progress.setNextReviewAt(result.nextReviewAt());
        progress.setStatus(determineStatus(result.newRepetitions()));

        if (request.quality() >= 3) progress.setCorrectCount(progress.getCorrectCount() + 1);

        UserProgress saved = progressRepository.save(progress);
        return enrichWithTranslations(List.of(saved), locale).get(0);
    }

    // ── Logic bổ trợ đa ngôn ngữ ──────────────────────────────

    private List<ProgressResponse> enrichWithTranslations(List<UserProgress> list, String locale) {
        if (list.isEmpty()) return List.of();

        List<Long> cardIds = list.stream().map(p -> p.getFlashcard().getId()).toList();

        // 1 Query lấy tất cả bản dịch của list card hiện tại
        Map<Long, List<FlashcardTranslation>> allTransMap = translationRepository
                .findAllByFlashcardIds(cardIds)
                .stream()
                .collect(Collectors.groupingBy(t -> t.getFlashcard().getId()));

        return list.stream().map(p -> {
            ProgressResponse resp = progressMapper.toResponse(p);
            Flashcard flashcard = p.getFlashcard();

            // Gắn translations map vào FlashcardResponse lồng bên trong
            Map<String, FlashcardResponse.TranslationContent> transMap = buildTranslationMap(
                    allTransMap.getOrDefault(flashcard.getId(), List.of()));

            // Build lại FlashcardResponse có chứa bản dịch
            FlashcardResponse enrichedCard = buildEnrichedCard(flashcard, locale, transMap);

            return new ProgressResponse(
                    resp.id(), enrichedCard, resp.status(), resp.reviewCount(),
                    resp.correctCount(), resp.easinessFactor(), resp.intervalDays(),
                    resp.sm2Repetitions(), resp.lastReviewedAt(), resp.nextReviewAt()
            );
        }).toList();
    }

    private FlashcardResponse buildEnrichedCard(Flashcard f, String locale, Map<String, FlashcardResponse.TranslationContent> transMap) {
        FlashcardResponse base = flashcardMapper.toResponse(f);
        FlashcardResponse.TranslationContent primary = transMap.get(locale);

        return new FlashcardResponse(
                base.id(), base.topicId(), base.topicName(), base.word(), base.pronunciation(),
                base.definition(), base.exampleSentence(), base.difficulty(), base.imageUrl(),
                locale,
                primary != null ? primary.definition() : null,
                primary != null ? primary.exampleSentence() : null,
                transMap, // Trả về toàn bộ map để FE đổi ngôn ngữ 0ms
                base.createdById(), base.createdByUsername(), base.createdAt()
        );
    }

    private Map<String, FlashcardResponse.TranslationContent> buildTranslationMap(List<FlashcardTranslation> list) {
        return list.stream().collect(Collectors.toMap(
                FlashcardTranslation::getLocale,
                t -> new FlashcardResponse.TranslationContent(t.getDefinition(), t.getExampleSentence())
        ));
    }

    private UserProgress.Status determineStatus(int reps) {
        if (reps == 0) return UserProgress.Status.LEARNING;
        return reps <= 2 ? UserProgress.Status.REVIEWING : UserProgress.Status.MASTERED;
    }
}