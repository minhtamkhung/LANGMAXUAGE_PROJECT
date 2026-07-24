package com.dmt.toeicapp.typing.service.impl;

import com.dmt.toeicapp.common.exception.AppException;
import com.dmt.toeicapp.common.security.SecurityUtils;
import com.dmt.toeicapp.progress.dto.ReviewRequest;
import com.dmt.toeicapp.progress.service.ProgressService;
import com.dmt.toeicapp.flashcard.dto.FlashcardResponse;
import com.dmt.toeicapp.flashcard.entity.Flashcard;
import com.dmt.toeicapp.flashcard.mapper.FlashcardMapper;
import com.dmt.toeicapp.flashcard.repository.FlashcardRepository;
import com.dmt.toeicapp.i18n.entity.FlashcardTranslation;
import com.dmt.toeicapp.i18n.repository.FlashcardTranslationRepository;
import com.dmt.toeicapp.topic.entity.Topic;
import com.dmt.toeicapp.topic.repository.TopicRepository;
import com.dmt.toeicapp.typing.dto.*;
import com.dmt.toeicapp.typing.entity.TypingSession;
import com.dmt.toeicapp.typing.repository.TypingSessionRepository;
import com.dmt.toeicapp.typing.service.TypingService;
import com.dmt.toeicapp.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TypingServiceImpl implements TypingService {

    private final TypingSessionRepository        typingSessionRepository;
    private final FlashcardRepository            flashcardRepository;
    private final FlashcardTranslationRepository translationRepository;
    private final TopicRepository                topicRepository;
    private final UserRepository                 userRepository;
    private final FlashcardMapper                flashcardMapper;
    private final ProgressService                progressService;

    private static final int DISTRACTOR_POOL = 50;
    private final SecureRandom random = new SecureRandom();

    // ── Public API ────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public TypingStartResponse start(TypingStartRequest request, String locale) {
        Long  currentUserId = SecurityUtils.getCurrentUserId();
        Topic topic         = topicRepository.findById(request.topicId())
                .orElseThrow(() -> AppException.notFound("Không tìm thấy topic"));

        // ── Lấy ngẫu nhiên N card (cùng chiến lược với QuizServiceImpl) ────
        int  cardCount  = request.cardCount();
        long totalCards = flashcardRepository.countByTopicId(topic.getId(), currentUserId);

        if (totalCards == 0)
            throw AppException.badRequest("Topic không có flashcard", "TOPIC_EMPTY");

        List<Flashcard> selectedCards = randomSample(topic.getId(), currentUserId, cardCount, totalCards);

        // ── Batch load translation theo locale ───────────────────────────────
        List<Long> cardIds = selectedCards.stream().map(Flashcard::getId).toList();

        Map<Long, FlashcardTranslation> translationMap = translationRepository
                .findByFlashcardIdsAndLocale(cardIds, locale)
                .stream()
                .collect(Collectors.toMap(t -> t.getFlashcard().getId(), t -> t));

        // ── Map sang FlashcardResponse (dùng MapStruct) + inject primaryLocale ─
        List<FlashcardResponse> cardResponses = selectedCards.stream()
                .map(card -> {
                    FlashcardResponse base = flashcardMapper.toResponse(card);
                    FlashcardTranslation tx = translationMap.get(card.getId());

                    // Trả về record mới với primaryLocale và primaryDefinition đã inject
                    return new FlashcardResponse(
                            base.id(), base.topicId(), base.topicName(),
                            base.word(), base.pronunciation(),
                            base.definition(), base.exampleSentence(),
                            base.difficulty(), base.imageUrl(), base.audioUrl(),
                            base.partOfSpeech(), base.relatedWords(),
                            locale,
                            tx != null ? tx.getDefinition()      : base.definition(),
                            tx != null ? tx.getExampleSentence() : base.exampleSentence(),
                            null, // translations — không cần ở typing
                            base.createdById(), base.createdByUsername(), base.createdAt()
                    );
                })
                .toList();

        // ── Tạo phiên trong DB ────────────────────────────────────────────────
        TypingSession session = typingSessionRepository.save(
                TypingSession.builder()
                        .user(userRepository.getReferenceById(currentUserId))
                        .topic(topic)
                        .totalCards(selectedCards.size())
                        .startedAt(OffsetDateTime.now())
                        .build()
        );

        log.info("TypingSession started: sessionId={}, topic={}, cards={}, locale={}",
                session.getId(), topic.getName(), selectedCards.size(), locale);

        return new TypingStartResponse(session.getId(), topic.getId(), topic.getName(), cardResponses);
    }

    @Override
    @Transactional
    public TypingSubmitResponse submit(TypingSubmitRequest request, String locale) {
        Long currentUserId = SecurityUtils.getCurrentUserId();

        // ── Tìm phiên — bảo vệ: user chỉ submit phiên của chính mình ─────────
        TypingSession session = typingSessionRepository
                .findByIdAndUserId(request.sessionId(), currentUserId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy phiên luyện gõ"));

        if (session.getFinishedAt() != null)
            throw AppException.badRequest("Phiên này đã kết thúc", "TYPING_SESSION_ALREADY_FINISHED");

        // ── Batch load đáp án đúng (từ gốc từ flashcard) ──────────────────────
        List<Long> flashcardIds = request.answers().stream()
                .map(TypingSubmitRequest.AnswerItem::flashcardId)
                .toList();

        Map<Long, Flashcard> flashcardMap = flashcardRepository
                .findAllById(flashcardIds)
                .stream()
                .filter(Flashcard::isActive)
                .collect(Collectors.toMap(Flashcard::getId, f -> f));

        // ── Chấm điểm từng câu ──────────────────────────────────────────────
        List<TypingSubmitResponse.WordResult> details = new ArrayList<>();
        int correctCount = 0;

        for (TypingSubmitRequest.AnswerItem answer : request.answers()) {
            Flashcard card          = flashcardMap.get(answer.flashcardId());
            String    correctAnswer = card != null ? card.getWord() : "";
            String    typed         = answer.typedAnswer() != null ? answer.typedAnswer().trim() : "";

            // So sánh không phân biệt hoa thường, bỏ khoảng trắng thừa
            boolean correct = !typed.isEmpty() && typed.equalsIgnoreCase(correctAnswer.trim());
            if (correct) correctCount++;

            if (card != null) {
                try {
                    progressService.review(new ReviewRequest(card.getId(), correct ? 5 : 1), locale);
                } catch (Exception e) {
                    log.error("Failed to update progress for card {} in typing session: {}", card.getId(), e.getMessage());
                }
            }

            details.add(new TypingSubmitResponse.WordResult(
                    answer.flashcardId(),
                    correctAnswer,
                    typed,
                    correct
            ));
        }

        // ── Tính accuracy ────────────────────────────────────────────────────
        int        total    = request.answers().size();
        BigDecimal accuracy = total > 0
                ? BigDecimal.valueOf(correctCount * 100.0 / total).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // ── Cập nhật session ─────────────────────────────────────────────────
        OffsetDateTime now = OffsetDateTime.now();
        session.setCorrectCount(correctCount);
        session.setTotalCards(total);
        session.setAccuracy(accuracy);
        session.setDurationSeconds(request.durationSeconds());
        session.setFinishedAt(now);
        typingSessionRepository.save(session);

        String topicName = session.getTopic() != null ? session.getTopic().getName() : "";

        log.info("TypingSession finished: sessionId={}, correct={}/{}, accuracy={}",
                session.getId(), correctCount, total, accuracy);

        return new TypingSubmitResponse(
                session.getId(), topicName, total, correctCount,
                accuracy, request.durationSeconds(), details
        );
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Random sample N card từ topic — cùng chiến lược với QuizServiceImpl để đảm bảo nhất quán.
     * Nếu totalCards <= cardCount: lấy tất cả, shuffle trong memory.
     * Nếu totalCards > cardCount: random page offset, shuffle pool rồi trim.
     */
    private List<Flashcard> randomSample(Long topicId, Long userId, int cardCount, long totalCards) {
        if (totalCards <= cardCount) {
            List<Flashcard> all = new ArrayList<>(flashcardRepository
                    .findByTopicId(topicId, userId, PageRequest.of(0, (int) totalCards))
                    .getContent());
            Collections.shuffle(all, random);
            return all;
        }

        int fetchSize  = Math.min(cardCount * 2, (int) totalCards);
        int maxPage    = (int) Math.ceil((double) totalCards / fetchSize);
        int randomPage = random.nextInt(maxPage);

        List<Flashcard> pool = new ArrayList<>(flashcardRepository
                .findByTopicId(topicId, userId, PageRequest.of(randomPage, fetchSize))
                .getContent());

        if (pool.size() < cardCount) {
            pool = new ArrayList<>(flashcardRepository
                    .findByTopicId(topicId, userId, PageRequest.of(0, (int) Math.min(cardCount * 2, totalCards)))
                    .getContent());
        }

        Collections.shuffle(pool, random);
        return pool.stream().limit(cardCount).toList();
    }
}
