package com.dmt.toeicapp.matching.service.impl;

import com.dmt.toeicapp.common.exception.AppException;
import com.dmt.toeicapp.common.security.SecurityUtils;
import com.dmt.toeicapp.progress.dto.ReviewRequest;
import com.dmt.toeicapp.progress.service.ProgressService;
import com.dmt.toeicapp.flashcard.entity.Flashcard;
import com.dmt.toeicapp.flashcard.repository.FlashcardRepository;
import com.dmt.toeicapp.i18n.entity.FlashcardTranslation;
import com.dmt.toeicapp.i18n.repository.FlashcardTranslationRepository;
import com.dmt.toeicapp.topic.entity.Topic;
import com.dmt.toeicapp.topic.repository.TopicRepository;
import com.dmt.toeicapp.matching.dto.*;
import com.dmt.toeicapp.matching.entity.MatchingSession;
import com.dmt.toeicapp.matching.repository.MatchingSessionRepository;
import com.dmt.toeicapp.matching.service.MatchingService;
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
public class MatchingServiceImpl implements MatchingService {

    private final MatchingSessionRepository     matchingSessionRepository;
    private final FlashcardRepository           flashcardRepository;
    private final FlashcardTranslationRepository translationRepository;
    private final TopicRepository               topicRepository;
    private final UserRepository                userRepository;
    private final ProgressService               progressService;

    private final SecureRandom random = new SecureRandom();

    @Override
    @Transactional
    public MatchingStartResponse start(MatchingStartRequest request, String locale) {
        Long  currentUserId = SecurityUtils.getCurrentUserId();
        Topic topic         = topicRepository.findById(request.topicId())
                .orElseThrow(() -> AppException.notFound("Không tìm thấy topic"));

        int  pairCount  = request.pairCount();
        long totalCards = flashcardRepository.countByTopicId(topic.getId(), currentUserId);

        if (totalCards == 0) {
            throw AppException.badRequest("Topic không có flashcard để chơi", "TOPIC_EMPTY");
        }

        // Chọn ngẫu nhiên N cards
        List<Flashcard> selectedCards = randomSample(topic.getId(), currentUserId, pairCount, totalCards);

        // Load bản dịch theo locale
        List<Long> cardIds = selectedCards.stream().map(Flashcard::getId).toList();
        Map<Long, FlashcardTranslation> translationMap = translationRepository
                .findByFlashcardIdsAndLocale(cardIds, locale)
                .stream()
                .collect(Collectors.toMap(t -> t.getFlashcard().getId(), t -> t));

        // Chuẩn bị danh sách Words
        List<MatchingStartResponse.WordItem> words = selectedCards.stream()
                .map(c -> new MatchingStartResponse.WordItem(c.getId(), c.getWord(), c.getPronunciation()))
                .collect(Collectors.toList());

        // Chuẩn bị danh sách Definitions
        List<MatchingStartResponse.DefinitionItem> definitions = selectedCards.stream()
                .map(c -> {
                    FlashcardTranslation tx = translationMap.get(c.getId());
                    String text = (tx != null) ? tx.getDefinition() : c.getDefinition();
                    return new MatchingStartResponse.DefinitionItem(c.getId(), text);
                })
                .collect(Collectors.toList());

        // Xáo trộn độc lập 2 danh sách trong memory trước khi gửi về
        Collections.shuffle(words, random);
        Collections.shuffle(definitions, random);

        // Tạo MatchingSession
        MatchingSession session = matchingSessionRepository.save(
                MatchingSession.builder()
                        .user(userRepository.getReferenceById(currentUserId))
                        .topic(topic)
                        .totalPairs(selectedCards.size())
                        .startedAt(OffsetDateTime.now())
                        .build()
        );

        log.info("MatchingSession started: sessionId={}, topic={}, pairs={}",
                session.getId(), topic.getName(), selectedCards.size());

        return new MatchingStartResponse(
                session.getId(),
                topic.getId(),
                topic.getName(),
                words,
                definitions
        );
    }

    @Override
    @Transactional
    public MatchingSubmitResponse submit(MatchingSubmitRequest request, String locale) {
        Long currentUserId = SecurityUtils.getCurrentUserId();

        MatchingSession session = matchingSessionRepository
                .findByIdAndUserId(request.sessionId(), currentUserId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy phiên chơi ghép cặp"));

        if (session.getFinishedAt() != null) {
            throw AppException.badRequest("Phiên này đã kết thúc", "MATCHING_SESSION_ALREADY_FINISHED");
        }

        int totalPairs = request.pairs().size();
        if (totalPairs != session.getTotalPairs()) {
            throw AppException.badRequest("Số lượng cặp ghép không khớp với phiên chơi", "MATCHING_PAIR_COUNT_MISMATCH");
        }

        // Kiểm tra tính hợp lệ dữ liệu (chống trùng lặp/gian lận)
        long uniqueWordIds = request.pairs().stream().map(MatchingSubmitRequest.MatchPair::wordId).distinct().count();
        long uniqueDefIds  = request.pairs().stream().map(MatchingSubmitRequest.MatchPair::definitionId).distinct().count();
        if (uniqueWordIds != totalPairs || uniqueDefIds != totalPairs) {
            throw AppException.badRequest("Dữ liệu ghép cặp không hợp lệ (trùng lặp phần tử)", "MATCHING_DUPLICATE_ELEMENTS");
        }

        // Xác thực các flashcard tồn tại và thuộc chủ đề này
        List<Long> flashcardIds = request.pairs().stream().map(MatchingSubmitRequest.MatchPair::wordId).toList();
        List<Flashcard> cards = flashcardRepository.findAllById(flashcardIds);
        if (cards.size() != totalPairs) {
            throw AppException.badRequest("Một số flashcard không hợp lệ hoặc đã bị xóa", "MATCHING_INVALID_FLASHCARDS");
        }
        boolean allBelongToTopic = cards.stream()
                .allMatch(c -> c.getTopic().getId().equals(session.getTopic().getId()));
        if (!allBelongToTopic) {
            throw AppException.badRequest("Có chứa flashcard không thuộc chủ đề của phiên chơi", "MATCHING_TOPIC_MISMATCH");
        }

        // Chấm điểm: từ ghép đúng khi wordId == definitionId
        int correctPairs = 0;
        for (MatchingSubmitRequest.MatchPair pair : request.pairs()) {
            boolean correct = pair.wordId().equals(pair.definitionId());
            if (correct) {
                correctPairs++;
            }
            try {
                progressService.review(new ReviewRequest(pair.wordId(), correct ? 4 : 1), locale);
            } catch (Exception e) {
                log.error("Failed to update progress for card {} in matching session: {}", pair.wordId(), e.getMessage());
            }
        }

        BigDecimal accuracy = totalPairs > 0
                ? BigDecimal.valueOf(correctPairs * 100.0 / totalPairs).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        OffsetDateTime now = OffsetDateTime.now();
        session.setCorrectPairs(correctPairs);
        session.setTotalPairs(totalPairs);
        session.setAccuracy(accuracy);
        session.setDurationSeconds(request.durationSeconds());
        session.setFinishedAt(now);
        matchingSessionRepository.save(session);

        String topicName = session.getTopic() != null ? session.getTopic().getName() : "";

        log.info("MatchingSession finished: sessionId={}, correct={}/{}, accuracy={}",
                session.getId(), correctPairs, totalPairs, accuracy);

        return new MatchingSubmitResponse(
                session.getId(),
                topicName,
                totalPairs,
                correctPairs,
                accuracy,
                request.durationSeconds()
        );
    }

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
