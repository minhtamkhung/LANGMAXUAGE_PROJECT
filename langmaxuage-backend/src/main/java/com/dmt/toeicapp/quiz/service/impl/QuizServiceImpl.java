package com.dmt.toeicapp.quiz.service.impl;

import com.dmt.toeicapp.common.exception.AppException;
import com.dmt.toeicapp.common.security.SecurityUtils;
import com.dmt.toeicapp.flashcard.entity.Flashcard;
import com.dmt.toeicapp.flashcard.repository.FlashcardRepository;
import com.dmt.toeicapp.i18n.entity.FlashcardTranslation;
import com.dmt.toeicapp.i18n.repository.FlashcardTranslationRepository;
import com.dmt.toeicapp.quiz.dto.*;
import com.dmt.toeicapp.quiz.entity.QuizAnswer;
import com.dmt.toeicapp.quiz.entity.QuizAttempt;
import com.dmt.toeicapp.quiz.repository.QuizAnswerRepository;
import com.dmt.toeicapp.quiz.repository.QuizAttemptRepository;
import com.dmt.toeicapp.quiz.service.QuizService;
import com.dmt.toeicapp.topic.entity.Topic;
import com.dmt.toeicapp.topic.repository.TopicRepository;
import com.dmt.toeicapp.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuizServiceImpl implements QuizService {

    private final QuizAttemptRepository quizAttemptRepository;
    private final QuizAnswerRepository  quizAnswerRepository;
    private final FlashcardRepository   flashcardRepository;
    private final TopicRepository       topicRepository;
    private final FlashcardTranslationRepository translationRepository;
    private final UserRepository        userRepository;

    private static final int OPTIONS_COUNT  = 4;
    private static final int DISTRACTOR_POOL = 50; // Pool distractor tối đa để tránh load quá nhiều
    private final SecureRandom random = new SecureRandom();

    @Override
    @Transactional
    public QuizAttemptSummary start(QuizStartRequest request, String locale) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        Topic topic = topicRepository.findById(request.topicId())
                .orElseThrow(() -> AppException.notFound("Không tìm thấy topic"));

        // ── [FIX #7] Random sampling đúng cách ──────────────────────────────
        // Thay vì load 200 card cố định rồi shuffle (bias, O(200) luôn),
        // ta đếm tổng số card hợp lệ, rồi chỉ lấy đúng số cần dùng.
        //
        // Chiến lược:
        //   1. Đếm totalCards từ DB
        //   2. Nếu totalCards <= questionCount: lấy tất cả rồi shuffle
        //   3. Nếu totalCards > questionCount: lấy questionCount * 2 với random offset
        //      rồi shuffle và trim → phân phối đồng đều hơn
        int questionCount = request.questionCount();
        long totalCards   = flashcardRepository.countByTopicId(topic.getId(), currentUserId);

        if (totalCards == 0) throw AppException.badRequest("Topic không có flashcard", "TOPIC_EMPTY");

        List<Flashcard> selectedCards;
        if (totalCards <= questionCount) {
            // Lấy tất cả, shuffle trong memory
            selectedCards = new ArrayList<>(flashcardRepository
                    .findByTopicId(topic.getId(), currentUserId,
                            PageRequest.of(0, (int) totalCards)).getContent());
            Collections.shuffle(selectedCards, random);
        } else {
            // Lấy questionCount card với random page offset → mọi card đều có cơ hội
            int fetchSize = Math.min(questionCount * 2, (int) totalCards);
            int maxPage   = (int) Math.ceil((double) totalCards / fetchSize);
            int randomPage = random.nextInt(maxPage);
            List<Flashcard> pool = new ArrayList<>(flashcardRepository
                    .findByTopicId(topic.getId(), currentUserId,
                            PageRequest.of(randomPage, fetchSize)).getContent());
            Collections.shuffle(pool, random);
            selectedCards = pool.stream().limit(questionCount).toList();
        }

        // Pool distractor: load thêm một số card từ topic để tạo câu trả lời nhiễu
        // Dùng page ngẫu nhiên khác để tránh trùng với selectedCards
        List<Flashcard> distractorPool = new ArrayList<>(flashcardRepository
                .findByTopicId(topic.getId(), currentUserId,
                        PageRequest.of(0, DISTRACTOR_POOL)).getContent());
        Collections.shuffle(distractorPool, random);

        // Build localizedDefs: gộp selectedCards + distractorPool để lấy đủ translation
        List<Long> allNeededIds = new ArrayList<>();
        selectedCards.forEach(c -> allNeededIds.add(c.getId()));
        distractorPool.stream()
                .filter(c -> !allNeededIds.contains(c.getId()))
                .forEach(c -> allNeededIds.add(c.getId()));

        Map<Long, String> localizedDefs = translationRepository
                .findByFlashcardIdsAndLocale(allNeededIds, locale)
                .stream()
                .collect(Collectors.toMap(t -> t.getFlashcard().getId(), FlashcardTranslation::getDefinition));

        QuizAttempt attempt = quizAttemptRepository.save(QuizAttempt.builder()
                .user(userRepository.getReferenceById(currentUserId))
                .topic(topic).totalQuestions(selectedCards.size()).build());

        List<QuizQuestionResponse> questions = selectedCards.stream().map(card -> {
            String correctDef = localizedDefs.getOrDefault(card.getId(), card.getDefinition());

            // ── BUG #4 FIX ────────────────────────────────────────────────────
            // BUG CŨ: distractors không lọc trùng với correctDef.
            //         Khi nhiều card fallback về getDefinition() tiếng Anh giống
            //         nhau (do chưa có bản dịch), options sẽ có 2-3 đáp án giống
            //         correctDef → lộ đáp án hoặc quiz không hợp lệ.
            //
            // FIX:   Thêm .filter(d -> !d.equalsIgnoreCase(correctDef)) trước
            //         .distinct() để đảm bảo không có distractor nào trùng đáp án đúng.
            // ────────────────────────────────────────────────────────────────────
            List<String> distractors = distractorPool.stream()
                    .filter(c -> !c.getId().equals(card.getId()))
                    .map(c -> localizedDefs.getOrDefault(c.getId(), c.getDefinition()))
                    .filter(d -> !d.equalsIgnoreCase(correctDef))
                    .distinct()
                    .collect(Collectors.toList());
            Collections.shuffle(distractors, random);

            List<String> options = new ArrayList<>();
            options.add(correctDef);
            distractors.stream().limit(3).forEach(options::add);

            while (options.size() < 4) options.add("None of the above");
            Collections.shuffle(options);

            return new QuizQuestionResponse(card.getId(), card.getWord(), card.getPronunciation(), options);
        }).toList();

        return toSummary(attempt, topic, questions);
    }

    @Override
    @Transactional
    public QuizAnswerResponse answer(Long attemptId, QuizAnswerRequest request, String locale) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        QuizAttempt attempt = quizAttemptRepository.findByIdAndUserId(attemptId, currentUserId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy lượt làm bài"));

        Flashcard flashcard = flashcardRepository.findByIdAndActiveTrue(request.flashcardId())
                .orElseThrow(() -> AppException.notFound("Không tìm thấy thẻ từ"));

        String correctAnswer = translationRepository.findByFlashcardIdAndLocale(flashcard.getId(), locale)
                .map(FlashcardTranslation::getDefinition)
                .orElse(flashcard.getDefinition());

        boolean isCorrect = correctAnswer.trim().equalsIgnoreCase(request.selectedAnswer().trim());

        // Lưu correctAnswer vào QuizAnswer để dùng lại trong review() — xem BUG #3 FIX
        quizAnswerRepository.save(QuizAnswer.builder()
                .attempt(attempt).flashcard(flashcard)
                .selectedAnswer(request.selectedAnswer())
                .correctAnswer(correctAnswer)
                .isCorrect(isCorrect)
                .timeSpentSeconds(request.timeSpentSeconds())
                .build());

        if (isCorrect) {
            attempt.setCorrectAnswers(attempt.getCorrectAnswers() + 1);
            quizAttemptRepository.save(attempt);
        }

        return new QuizAnswerResponse(flashcard.getId(), request.selectedAnswer(), correctAnswer, isCorrect);
    }

    @Override
    @Transactional
    public QuizAttemptSummary finish(Long attemptId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();

        QuizAttempt attempt = quizAttemptRepository
                .findByIdAndUserId(attemptId, currentUserId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy quiz attempt"));

        if (attempt.getFinishedAt() != null) {
            throw AppException.badRequest("Quiz này đã kết thúc", "QUIZ_ALREADY_FINISHED");
        }

        OffsetDateTime now = OffsetDateTime.now();
        int score = attempt.getTotalQuestions() > 0
                ? (int) Math.round((double) attempt.getCorrectAnswers()
                / attempt.getTotalQuestions() * 100)
                : 0;
        int duration = (int) ChronoUnit.SECONDS.between(attempt.getStartedAt(), now);

        attempt.setFinishedAt(now);
        attempt.setScore(score);
        attempt.setDurationSeconds(duration);
        quizAttemptRepository.save(attempt);

        log.info("Quiz finished: attemptId={}, score={}, duration={}s",
                attemptId, score, duration);

        return toSummary(attempt, attempt.getTopic(), null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuizAttemptSummary> getHistory() {
        Long userId = SecurityUtils.getCurrentUserId();
        return quizAttemptRepository
                .findByUserIdOrderByStartedAtDesc(userId)
                .stream()
                .map(a -> toSummary(a, a.getTopic(), null))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public QuizReviewResponse review(Long attemptId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();

        QuizAttempt attempt = quizAttemptRepository
                .findByIdAndUserId(attemptId, currentUserId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy quiz attempt"));

        List<QuizReviewResponse.WrongAnswerDetail> wrongAnswers =
                quizAnswerRepository.findByAttemptIdAndIsCorrectFalse(attemptId)
                        .stream()
                        .map(a -> new QuizReviewResponse.WrongAnswerDetail(
                                a.getFlashcard().getId(),
                                a.getFlashcard().getWord(),
                                a.getFlashcard().getDefinition(),  // định nghĩa EN gốc — để tham khảo
                                a.getSelectedAnswer(),
                                a.getCorrectAnswer()               // ← FIX: đọc từ field đã lưu lúc chấm
                        ))
                        .toList();

        return new QuizReviewResponse(
                attemptId,
                attempt.getTotalQuestions(),
                attempt.getCorrectAnswers(),
                attempt.getScore(),
                wrongAnswers
        );
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private QuizAttemptSummary toSummary(QuizAttempt a, Topic t, List<QuizQuestionResponse> q) {
        return new QuizAttemptSummary(a.getId(), t.getId(), t.getName(), a.getQuizType().name(),
                a.getTotalQuestions(), a.getCorrectAnswers(), a.getScore(), a.getDurationSeconds(),
                a.getStartedAt(), a.getFinishedAt(), q);
    }
}