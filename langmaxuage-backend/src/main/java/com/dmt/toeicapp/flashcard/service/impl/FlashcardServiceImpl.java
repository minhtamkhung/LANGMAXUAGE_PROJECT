package com.dmt.toeicapp.flashcard.service.impl;

import com.dmt.toeicapp.common.aop.Auditable;
import com.dmt.toeicapp.common.constant.AppConstants;
import com.dmt.toeicapp.common.exception.AppException;
import com.dmt.toeicapp.common.security.SecurityUtils;
import com.dmt.toeicapp.flashcard.dto.BulkImportResult;
import com.dmt.toeicapp.flashcard.dto.FlashcardRequest;
import com.dmt.toeicapp.flashcard.dto.FlashcardResponse;
import com.dmt.toeicapp.flashcard.dto.RelatedWordResponse;
import com.dmt.toeicapp.flashcard.entity.Flashcard;
import com.dmt.toeicapp.flashcard.mapper.FlashcardMapper;
import com.dmt.toeicapp.flashcard.repository.FlashcardRepository;
import com.dmt.toeicapp.flashcard.service.CloudinaryService;
import com.dmt.toeicapp.flashcard.service.DatamuseEnrichmentService;
import com.dmt.toeicapp.flashcard.service.FlashcardService;
import com.dmt.toeicapp.i18n.entity.FlashcardTranslation;
import com.dmt.toeicapp.i18n.repository.FlashcardTranslationRepository;
import com.dmt.toeicapp.topic.entity.Topic;
import com.dmt.toeicapp.topic.repository.TopicRepository;
import com.dmt.toeicapp.user.entity.User;
import com.dmt.toeicapp.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;
import com.dmt.toeicapp.external.dictionary.DictionaryClient;
import com.dmt.toeicapp.external.dictionary.WordEnrichmentResult;
import java.time.Duration;
import lombok.extern.slf4j.Slf4j;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FlashcardServiceImpl implements FlashcardService {

    private final FlashcardRepository            flashcardRepository;
    private final TopicRepository                topicRepository;
    private final UserRepository                 userRepository;
    private final FlashcardMapper                flashcardMapper;
    private final CloudinaryService cloudinaryService;
    private final FlashcardTranslationRepository translationRepository;
    private final DatamuseEnrichmentService datamuseEnrichmentService;
    private final DictionaryClient               dictionaryClient;


    // ── Read methods ──────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public Page<FlashcardResponse> getAccessible(String locale,
                                                 boolean includeAllLocales,
                                                 Pageable pageable) {
        Long userId = SecurityUtils.getCurrentUserId();
        Page<Flashcard> page = flashcardRepository.findAccessibleByUser(userId, pageable);
        return applyTranslationsToPage(page, locale, includeAllLocales);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FlashcardResponse> getByTopic(Long topicId,
                                              String locale,
                                              boolean includeAllLocales,
                                              Pageable pageable) {
        Topic topic = findTopicAndCheckAccess(topicId);
        Long userId = SecurityUtils.getCurrentUserId();
        Page<Flashcard> page = flashcardRepository.findByTopicId(topic.getId(), userId, pageable);
        return applyTranslationsToPage(page, locale, includeAllLocales);
    }

    @Override
    @Transactional(readOnly = true)
    public FlashcardResponse getById(Long id,
                                     String locale,
                                     boolean includeAllLocales) {
        // JOIN FETCH: load card + relatedWords trong 1 query
        Flashcard card = flashcardRepository.findByIdWithRelatedWords(id)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy flashcard với id = " + id));

        // Kiểm tra quyền truy cập
        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (!card.getTopic().isSystem() && !card.getCreatedBy().getId().equals(currentUserId)) {
            throw AppException.forbidden("Bạn không có quyền truy cập flashcard này");
        }

        FlashcardResponse base = flashcardMapper.toResponse(card);
        List<RelatedWordResponse> relatedWords = mapRelatedWords(card);

        if (isDefaultLocale(locale)) {
            return buildResponse(base, null, null, null, relatedWords);
        }

        // Load translation cho primary locale
        FlashcardTranslation primary = translationRepository
                .findByFlashcardIdAndLocale(id, locale)
                .orElse(null);

        // Load all translations nếu cần
        Map<String, FlashcardResponse.TranslationContent> allMap = null;
        if (includeAllLocales) {
            allMap = buildTranslationMap(
                    translationRepository.findByFlashcardId(id)
            );
        }

        return buildResponse(base, locale, primary, allMap, relatedWords);
    }

    // ── Write methods — không cần locale ─────────────────────

    @Override
    @Auditable(action = "CREATE", entity = "FLASHCARD")
    @Transactional
    public FlashcardResponse create(FlashcardRequest request) {
        Long  currentUserId = SecurityUtils.getCurrentUserId();
        Topic topic         = findTopicAndCheckAccess(request.topicId());

        if (flashcardRepository.existsByWordAndTopicIdAndUser(
                request.word(), topic.getId(), currentUserId)) {
            throw AppException.conflict(
                    "Từ '" + request.word() + "' đã tồn tại trong topic này",
                    "FLASHCARD_WORD_DUPLICATE");
        }

        User owner = userRepository.getReferenceById(currentUserId);

        String pronunciation = request.pronunciation();
        String audioUrl = null;
        String partOfSpeech = null;

        try {
            WordEnrichmentResult enrichment = dictionaryClient.enrichWord(request.word())
                    .timeout(Duration.ofSeconds(3))
                    .block();
            if (enrichment != null) {
                if (pronunciation == null || pronunciation.isBlank()) {
                    pronunciation = enrichment.pronunciation();
                }
                audioUrl = enrichment.audioUrl();
                partOfSpeech = enrichment.partOfSpeech();
            }
        } catch (Exception e) {
            log.warn("Failed to auto-enrich manual flashcard '{}': {}", request.word(), e.getMessage());
        }

        Flashcard card = Flashcard.builder()
                .topic(topic).createdBy(owner)
                .word(request.word())
                .pronunciation(pronunciation)
                .audioUrl(audioUrl)
                .partOfSpeech(partOfSpeech)
                .definition(request.definition())
                .exampleSentence(request.exampleSentence())
                .difficulty(parseDifficulty(request.difficulty()))
                .active(true)
                .build();

        Flashcard savedCard = flashcardRepository.save(card);

        final Long savedCardId = savedCard.getId();
        final String savedWord = savedCard.getWord();
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    datamuseEnrichmentService.enrichRelatedWordsAsync(savedCardId, savedWord);
                }
            });
        } else {
            datamuseEnrichmentService.enrichRelatedWordsAsync(savedCardId, savedWord);
        }

        return flashcardMapper.toResponse(savedCard);
    }

    @Override
    @Auditable(action = "UPDATE", entity = "FLASHCARD")
    @Transactional
    public FlashcardResponse update(Long id, FlashcardRequest request) {
        Flashcard card  = findCardAndCheckOwnership(id);
        Topic     topic = findTopicAndCheckAccess(request.topicId());
        Long  currentUserId = SecurityUtils.getCurrentUserId();

        boolean wordChanged = !card.getWord().equalsIgnoreCase(request.word());
        if (wordChanged && flashcardRepository.existsByWordAndTopicIdAndUser(
                request.word(), topic.getId(), currentUserId)) {
            throw AppException.conflict(
                    "Từ '" + request.word() + "' đã tồn tại trong topic này",
                    "FLASHCARD_WORD_DUPLICATE");
        }

        card.setTopic(topic);
        card.setWord(request.word());
        card.setDefinition(request.definition());
        card.setExampleSentence(request.exampleSentence());
        card.setDifficulty(parseDifficulty(request.difficulty()));

        String pronunciation = request.pronunciation();
        if (wordChanged || pronunciation == null || pronunciation.isBlank()) {
            try {
                WordEnrichmentResult enrichment = dictionaryClient.enrichWord(request.word())
                        .timeout(Duration.ofSeconds(3))
                        .block();
                if (enrichment != null) {
                    if (pronunciation == null || pronunciation.isBlank()) {
                        pronunciation = enrichment.pronunciation();
                    }
                    card.setAudioUrl(enrichment.audioUrl());
                    card.setPartOfSpeech(enrichment.partOfSpeech());
                }
            } catch (Exception e) {
                log.warn("Failed to auto-enrich updated flashcard '{}': {}", request.word(), e.getMessage());
            }
        }
        card.setPronunciation(pronunciation);

        return flashcardMapper.toResponse(flashcardRepository.save(card));
    }

    @Override
    @Auditable(action = "DELETE", entity = "FLASHCARD")
    @Transactional
    public void delete(Long id) {
        Flashcard card = findCardAndCheckOwnership(id);
        card.setActive(false);
        flashcardRepository.save(card);
    }

    // ── Bulk Import CSV ───────────────────────────────────────

    @Override
    @Transactional
    public BulkImportResult bulkImport(Long topicId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw AppException.badRequest("File CSV không được rỗng", "EMPTY_FILE");
        }

        String filename = file.getOriginalFilename();
        if (filename == null || (!filename.endsWith(".csv") && !filename.endsWith(".txt"))) {
            throw AppException.badRequest("Chỉ hỗ trợ file .csv hoặc .txt", "INVALID_FILE_TYPE");
        }

        Topic topic         = findTopicAndCheckAccess(topicId);
        Long  currentUserId = SecurityUtils.getCurrentUserId();
        User  owner         = userRepository.getReferenceById(currentUserId);

        int successCount = 0;
        int failCount    = 0;
        List<String> errors = new ArrayList<>();

        // [FIX #10] Dùng Apache Commons CSV thay thế custom parser.
        // CSVFormat.DEFAULT tự xử lý:
        //   - Escaped quotes ("") bên trong field
        //   - Newline bên trong quoted field
        //   - BOM (ï»¿) khi withBOMInput(true)
        CSVFormat csvFormat = CSVFormat.DEFAULT.builder()
                .setHeader()                 // dòng đầu tiên là header
                .setSkipHeaderRecord(true)   // bỏ qua header khi iterate
                .setIgnoreEmptyLines(true)
                .setTrim(true)
                .setIgnoreSurroundingSpaces(true)
                .build();

        try (
            Reader reader    = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8);
            CSVParser parser = new CSVParser(reader, csvFormat)
        ) {
            int rowNum = 1; // header đã được skip, bắt đầu từ data row 2
            for (CSVRecord record : parser) {
                rowNum++;

                if (record.size() < 3) {
                    errors.add("Dòng " + rowNum + ": Thiếu cột (cần ít nhất word, pronunciation, definition)");
                    failCount++;
                    continue;
                }

                String word       = sanitizeCsvInput(record.get(0).trim());
                String pronun     = record.size() > 1 ? sanitizeCsvInput(record.get(1).trim()) : "";
                String definition = sanitizeCsvInput(record.get(2).trim());
                String example    = record.size() > 3 ? sanitizeCsvInput(record.get(3).trim()) : "";
                String diffStr    = record.size() > 4 ? record.get(4).trim().toUpperCase() : "MEDIUM";

                if (word.isEmpty()) {
                    errors.add("Dòng " + rowNum + ": Từ (cột 1) không được để trống");
                    failCount++;
                    continue;
                }
                if (definition.isEmpty()) {
                    errors.add("Dòng " + rowNum + ": Định nghĩa (cột 3) không được để trống");
                    failCount++;
                    continue;
                }

                Flashcard.Difficulty difficulty;
                try {
                    difficulty = diffStr.isEmpty()
                            ? Flashcard.Difficulty.MEDIUM
                            : Flashcard.Difficulty.valueOf(diffStr);
                } catch (IllegalArgumentException e) {
                    errors.add("Dòng " + rowNum + ": Độ khó '" + diffStr + "' không hợp lệ (EASY/MEDIUM/HARD)");
                    failCount++;
                    continue;
                }

                if (flashcardRepository.existsByWordAndTopicIdAndUser(word, topic.getId(), currentUserId)) {
                    errors.add("Dòng " + rowNum + ": Từ '" + word + "' đã tồn tại trong topic — bỏ qua");
                    failCount++;
                    continue;
                }

                String pronunciation = pronun;
                String audioUrl = null;
                String partOfSpeech = null;

                try {
                    WordEnrichmentResult enrichment = dictionaryClient.enrichWord(word)
                            .timeout(Duration.ofSeconds(2))
                            .block();
                    if (enrichment != null) {
                        if (pronunciation == null || pronunciation.isBlank()) {
                            pronunciation = enrichment.pronunciation();
                        }
                        audioUrl = enrichment.audioUrl();
                        partOfSpeech = enrichment.partOfSpeech();
                    }
                } catch (Exception e) {
                    log.warn("Failed to auto-enrich CSV imported flashcard '{}': {}", word, e.getMessage());
                }

                Flashcard card = Flashcard.builder()
                        .topic(topic)
                        .createdBy(owner)
                        .word(word)
                        .pronunciation(pronunciation)
                        .audioUrl(audioUrl)
                        .partOfSpeech(partOfSpeech)
                        .definition(definition)
                        .exampleSentence(example)
                        .difficulty(difficulty)
                        .active(true)
                        .build();

                Flashcard savedCard = flashcardRepository.save(card);
                final Long savedCardId = savedCard.getId();
                final String savedWord = savedCard.getWord();
                if (TransactionSynchronizationManager.isSynchronizationActive()) {
                    TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            datamuseEnrichmentService.enrichRelatedWordsAsync(savedCardId, savedWord);
                        }
                    });
                } else {
                    datamuseEnrichmentService.enrichRelatedWordsAsync(savedCardId, savedWord);
                }
                successCount++;
            }

        } catch (IOException e) {
            throw AppException.badRequest("Không thể đọc file CSV: " + e.getMessage(), "CSV_PARSE_ERROR");
        }

        return new BulkImportResult(successCount, failCount, errors);
    }

    private String sanitizeCsvInput(String input) {
        if (input == null || input.isEmpty()) return input;
        char firstChar = input.charAt(0);
        if (firstChar == '=' || firstChar == '+' || firstChar == '-' || firstChar == '@' || firstChar == '\t' || firstChar == '\r') {
            return "'" + input;
        }
        return input;
    }

    @Override
    @Transactional
    public FlashcardResponse uploadImage(Long id, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw AppException.badRequest("File ảnh không được rỗng", "EMPTY_FILE");
        }
        String contentType = file.getContentType();
        if (contentType == null || (!contentType.equals("image/jpeg") && !contentType.equals("image/png") && !contentType.equals("image/webp"))) {
            throw AppException.badRequest("Chỉ hỗ trợ upload ảnh dạng JPG, PNG hoặc WEBP", "INVALID_FILE_TYPE");
        }
        if (file.getSize() > 5 * 1024 * 1024) {
            throw AppException.badRequest("Dung lượng ảnh tối đa là 5MB", "FILE_TOO_LARGE");
        }

        Flashcard card = findCardAndCheckOwnership(id);
        if (card.getImagePublicId() != null) {
            cloudinaryService.delete(card.getImagePublicId());
        }
        CloudinaryService.UploadResult result = cloudinaryService.upload(file);
        card.setImageUrl(result.secureUrl());
        card.setImagePublicId(result.publicId());
        return flashcardMapper.toResponse(flashcardRepository.save(card));
    }

    @Override
    @Transactional
    public FlashcardResponse deleteImage(Long id) {
        Flashcard card = findCardAndCheckOwnership(id);
        if (card.getImagePublicId() != null) {
            cloudinaryService.delete(card.getImagePublicId());
            card.setImageUrl(null);
            card.setImagePublicId(null);
            flashcardRepository.save(card);
        }
        return flashcardMapper.toResponse(card);
    }

    // ── Private helpers ───────────────────────────────────────

    /**
     * Apply translations cho toàn bộ trang — batch load, tránh N+1.
     * Dùng 1 query cho primary locale + 1 query cho all locales (nếu cần).
     */
    private Page<FlashcardResponse> applyTranslationsToPage(Page<Flashcard> page,
                                                            String locale,
                                                            boolean includeAllLocales) {
        List<Long> ids = page.map(Flashcard::getId).toList();

        // JOIN FETCH: load relatedWords cho toàn bộ trang trong 1 query — tránh N+1
        Map<Long, List<RelatedWordResponse>> relatedWordsMap = flashcardRepository
                .findWithRelatedWordsByIds(ids)
                .stream()
                .collect(Collectors.toMap(
                        Flashcard::getId,
                        this::mapRelatedWords
                ));

        if (isDefaultLocale(locale)) {
            return page.map(card -> {
                FlashcardResponse base = flashcardMapper.toResponse(card);
                List<RelatedWordResponse> rw = relatedWordsMap.getOrDefault(card.getId(), List.of());
                return buildResponse(base, null, null, null, rw);
            });
        }

        // Query 1 — primary locale translations
        Map<Long, FlashcardTranslation> primaryMap = translationRepository
                .findByFlashcardIdsAndLocale(ids, locale)
                .stream()
                .collect(Collectors.toMap(t -> t.getFlashcard().getId(), t -> t));

        // Query 2 — tất cả locales (nếu cần toggle client-side)
        Map<Long, List<FlashcardTranslation>> allMap = null;
        if (includeAllLocales) {
            allMap = translationRepository
                    .findAllByFlashcardIds(ids)
                    .stream()
                    .collect(Collectors.groupingBy(t -> t.getFlashcard().getId()));
        }

        final Map<Long, List<FlashcardTranslation>> finalAllMap = allMap;

        return page.map(card -> {
            FlashcardResponse base = flashcardMapper.toResponse(card);
            FlashcardTranslation primary = primaryMap.get(card.getId());
            List<RelatedWordResponse> rw = relatedWordsMap.getOrDefault(card.getId(), List.of());

            Map<String, FlashcardResponse.TranslationContent> transMap = null;
            if (finalAllMap != null) {
                List<FlashcardTranslation> cardTrans = finalAllMap.get(card.getId());
                if (cardTrans != null) {
                    transMap = buildTranslationMap(cardTrans);
                }
            }

            return buildResponse(base, locale, primary, transMap, rw);
        });
    }

    /**
     * Gắn translation + relatedWords vào FlashcardResponse.
     * primary=null → chỉ trả về base (fallback tiếng Anh).
     */
    private FlashcardResponse buildResponse(FlashcardResponse base,
                                            String locale,
                                            FlashcardTranslation primary,
                                            Map<String, FlashcardResponse.TranslationContent> allMap,
                                            List<RelatedWordResponse> relatedWords) {
        return new FlashcardResponse(
                base.id(),
                base.topicId(),
                base.topicName(),
                base.word(),
                base.pronunciation(),
                base.definition(),        // tiếng Anh gốc — luôn giữ
                base.exampleSentence(),
                base.difficulty(),
                base.imageUrl(),
                base.audioUrl(),
                base.partOfSpeech(),
                relatedWords,
                locale,
                primary != null ? primary.getDefinition()       : null,
                primary != null ? primary.getExampleSentence()  : null,
                allMap,                   // null nếu includeAllLocales=false
                base.createdById(),
                base.createdByUsername(),
                base.createdAt()
        );
    }

    /**
     * Convert List<FlashcardRelatedWord> entity sang List<RelatedWordResponse> DTO.
     */
    private List<RelatedWordResponse> mapRelatedWords(Flashcard card) {
        if (card.getRelatedWords() == null || card.getRelatedWords().isEmpty()) {
            return List.of();
        }
        return card.getRelatedWords().stream()
                .map(rw -> new RelatedWordResponse(rw.getWord(), rw.getRelationType().name()))
                .toList();
    }

    /**
     * Convert list translations sang Map<locale, TranslationContent>.
     * Frontend dùng: card.translations['ja'].definition
     */
    private Map<String, FlashcardResponse.TranslationContent> buildTranslationMap(
            List<FlashcardTranslation> translations) {
        return translations.stream()
                .collect(Collectors.toMap(
                        FlashcardTranslation::getLocale,
                        t -> new FlashcardResponse.TranslationContent(
                                t.getDefinition(),
                                t.getExampleSentence()
                        )
                ));
    }

    private boolean isDefaultLocale(String locale) {
        return locale == null || AppConstants.DEFAULT_LOCALE.equalsIgnoreCase(locale);
    }

    private Flashcard findCardAndCheckAccess(Long id) {
        Long      currentUserId = SecurityUtils.getCurrentUserId();
        Flashcard card = flashcardRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> AppException.notFound(
                        "Không tìm thấy flashcard với id = " + id));

        boolean isSystemTopic = card.getTopic().isSystem();
        boolean isOwner       = card.getCreatedBy().getId().equals(currentUserId);

        if (!isSystemTopic && !isOwner) {
            throw AppException.forbidden("Bạn không có quyền truy cập flashcard này");
        }
        return card;
    }

    private Flashcard findCardAndCheckOwnership(Long id) {
        Long    currentUserId = SecurityUtils.getCurrentUserId();
        boolean isAdmin       = SecurityUtils.isAdmin();

        Flashcard card = flashcardRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> AppException.notFound(
                        "Không tìm thấy flashcard với id = " + id));

        if (!isAdmin && !card.getCreatedBy().getId().equals(currentUserId)) {
            throw AppException.forbidden("Bạn không có quyền chỉnh sửa flashcard này");
        }
        return card;
    }

    private Topic findTopicAndCheckAccess(Long topicId) {
        Long  currentUserId = SecurityUtils.getCurrentUserId();
        Topic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> AppException.notFound(
                        "Không tìm thấy topic với id = " + topicId));

        if (!topic.isSystem() && !topic.getCreatedBy().getId().equals(currentUserId)) {
            throw AppException.forbidden("Bạn không có quyền truy cập topic này");
        }
        return topic;
    }

    private Flashcard.Difficulty parseDifficulty(String difficulty) {
        if (difficulty == null || difficulty.isBlank()) return Flashcard.Difficulty.MEDIUM;
        try {
            return Flashcard.Difficulty.valueOf(difficulty.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw AppException.badRequest("Độ khó '" + difficulty + "' không hợp lệ (EASY, MEDIUM, HARD)", "INVALID_DIFFICULTY");
        }
    }

    @Override
    @Transactional
    public List<FlashcardResponse> createBulk(List<FlashcardRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            return List.of();
        }
        List<FlashcardResponse> responses = new ArrayList<>();
        for (FlashcardRequest request : requests) {
            responses.add(create(request));
        }
        return responses;
    }
}