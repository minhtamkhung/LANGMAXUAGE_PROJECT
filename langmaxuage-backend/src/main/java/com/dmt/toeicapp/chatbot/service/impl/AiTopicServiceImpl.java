package com.dmt.toeicapp.chatbot.service.impl;

import com.dmt.toeicapp.chatbot.dto.AiMultiLangTopicResponse;
import com.dmt.toeicapp.chatbot.dto.EnrichedFlashcardItem;
import com.dmt.toeicapp.chatbot.service.AiTopicPersistenceService;
import com.dmt.toeicapp.chatbot.service.AiTopicService;
import com.dmt.toeicapp.chatbot.service.QuotaService;
import com.dmt.toeicapp.common.exception.AppException;
import com.dmt.toeicapp.common.security.SecurityUtils;
import com.dmt.toeicapp.common.util.GeminiAiService;
import com.dmt.toeicapp.external.dictionary.DictionaryClient;
import com.dmt.toeicapp.external.dictionary.WordEnrichmentResult;
import com.dmt.toeicapp.topic.dto.TopicResponse;
import com.dmt.toeicapp.user.entity.User;
import com.dmt.toeicapp.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.List;

/**
 * Orchestrator — KHÔNG có @Transactional.
 *
 * Luồng:
 *   1. Check & increment quota (5 lần / ngày qua Redis Quota Service)
 *   2. Load user (TX tự động ngắn của Spring Data)
 *   3. Gọi Gemini API          → không giữ DB connection
 *   4. Validate response        → pure logic
 *   5. Gọi Dictionary API song song → không giữ DB connection
 *   6. Delegate lưu DB sang AiTopicPersistenceService (@Transactional — ~100ms)
 *   7. Ghi log SUCCESS hoặc FAILED (kèm rollback Redis quota nếu lỗi)
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class AiTopicServiceImpl implements AiTopicService {

    private final GeminiAiService           geminiAiService;
    private final UserRepository            userRepository;
    private final DictionaryClient          dictionaryClient;
    private final AiTopicPersistenceService aiTopicPersistenceService;
    private final QuotaService              quotaService;

    @Override
    public TopicResponse generateAndSaveTopic(String userRequest) {
        Long currentUserId = SecurityUtils.getCurrentUserId();

        // 1. Kiểm tra và tăng bộ đếm quota trong Redis (chặn ngay nếu vượt quá 5 lần/ngày)
        quotaService.checkAndIncrementQuota(currentUserId, userRequest);

        try {
            // 2. Load user
            User currentUser = userRepository.findById(currentUserId)
                    .orElseThrow(() -> AppException.notFound("Không tìm thấy người dùng hiện tại."));

            // 3. Gọi Gemini AI
            log.info("Calling Gemini API for user '{}' (request: '{}')", currentUser.getUsername(), userRequest);
            AiMultiLangTopicResponse aiResponse = geminiAiService.generateMultiLangTopic(userRequest);

            // 4. Validate AI response trước khi lưu DB
            validateAiResponse(aiResponse);

            // 5. Gọi Dictionary API song song
            log.info("Enriching {} flashcards with Dictionary API in parallel...", aiResponse.flashcards().size());
            List<EnrichedFlashcardItem> enrichedItems = Flux.fromIterable(aiResponse.flashcards())
                    .flatMap(cardItem ->
                            dictionaryClient.enrichWord(cardItem.word())
                                    .defaultIfEmpty(new WordEnrichmentResult(null, null, null))
                                    .map(enrichment -> new EnrichedFlashcardItem(cardItem, enrichment))
                                    .onErrorReturn(new EnrichedFlashcardItem(cardItem, new WordEnrichmentResult(null, null, null)))
                    )
                    .collectList()
                    .block();

            // 6. Lưu toàn bộ vào DB — TX chỉ mở tại đây (~100ms)
            TopicResponse topicResponse = aiTopicPersistenceService.saveAll(currentUser, aiResponse, enrichedItems);

            // 7. Ghi nhận thành công vào ai_usage_logs
            quotaService.recordSuccess(currentUserId, userRequest);

            return topicResponse;

        } catch (Exception e) {
            // 8. Rollback quota trong Redis và ghi nhận logs FAILED vào DB
            quotaService.rollbackQuotaAndRecordFailure(currentUserId, userRequest, e.getMessage());
            throw e;
        }
    }

    private void validateAiResponse(AiMultiLangTopicResponse response) {
        if (response == null) {
            throw AppException.badRequest("AI phản hồi không hợp lệ (null).", "AI_RESPONSE_NULL");
        }

        // 1. Kiểm tra topicTranslations có đủ locale en/vi
        if (response.topicTranslations() == null || response.topicTranslations().isEmpty()) {
            throw AppException.badRequest("AI không tạo mô tả chủ đề.", "AI_TOPIC_TRANSLATIONS_EMPTY");
        }

        boolean hasEn = response.topicTranslations().stream()
                .anyMatch(t -> "en".equalsIgnoreCase(t.locale()));
        boolean hasVi = response.topicTranslations().stream()
                .anyMatch(t -> "vi".equalsIgnoreCase(t.locale()));
        if (!hasEn || !hasVi) {
            throw AppException.badRequest("AI thiếu bản dịch tiếng Anh hoặc tiếng Việt cho chủ đề.", "AI_TOPIC_TRANSLATIONS_INCOMPLETE");
        }

        // 2. Kiểm tra flashcards không rỗng và nằm trong giới hạn 10 - 200
        if (response.flashcards() == null || response.flashcards().isEmpty()) {
            throw AppException.badRequest("Danh sách flashcards do AI tạo bị trống.", "AI_FLASHCARDS_EMPTY");
        }

        int size = response.flashcards().size();
        if (size < 10 || size > 200) {
            throw AppException.badRequest(
                    "Số lượng flashcards do AI sinh ra (" + size + ") không hợp lệ (phải từ 10 đến 200).",
                    "AI_FLASHCARDS_COUNT_INVALID");
        }

        // 3. Kiểm tra mỗi flashcard có word/definition/example
        for (int i = 0; i < response.flashcards().size(); i++) {
            var card = response.flashcards().get(i);
            int displayIdx = i + 1;
            if (card.word() == null || card.word().isBlank()) {
                throw AppException.badRequest("Flashcard thứ " + displayIdx + " bị trống từ (word).", "AI_FLASHCARD_WORD_EMPTY");
            }
            if (card.flashcardTranslations() == null || card.flashcardTranslations().isEmpty()) {
                throw AppException.badRequest("Flashcard '" + card.word() + "' thiếu danh sách bản dịch.", "AI_FLASHCARD_TRANSLATIONS_EMPTY");
            }

            var enTrans = card.flashcardTranslations().stream()
                    .filter(t -> "en".equalsIgnoreCase(t.locale()))
                    .findFirst().orElse(null);
            var viTrans = card.flashcardTranslations().stream()
                    .filter(t -> "vi".equalsIgnoreCase(t.locale()))
                    .findFirst().orElse(null);

            if (enTrans == null || enTrans.definition() == null || enTrans.definition().isBlank()) {
                throw AppException.badRequest("Flashcard '" + card.word() + "' thiếu định nghĩa tiếng Anh.", "AI_FLASHCARD_DEF_EN_EMPTY");
            }
            if (enTrans.exampleSentence() == null || enTrans.exampleSentence().isBlank()) {
                throw AppException.badRequest("Flashcard '" + card.word() + "' thiếu câu ví dụ tiếng Anh.", "AI_FLASHCARD_EX_EN_EMPTY");
            }
            if (viTrans == null || viTrans.definition() == null || viTrans.definition().isBlank()) {
                throw AppException.badRequest("Flashcard '" + card.word() + "' thiếu định nghĩa tiếng Việt.", "AI_FLASHCARD_DEF_VI_EMPTY");
            }
            if (viTrans.exampleSentence() == null || viTrans.exampleSentence().isBlank()) {
                throw AppException.badRequest("Flashcard '" + card.word() + "' thiếu câu ví dụ tiếng Việt.", "AI_FLASHCARD_EX_VI_EMPTY");
            }
        }
    }
}