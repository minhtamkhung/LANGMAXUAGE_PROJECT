package com.dmt.toeicapp.chatbot.service.impl;

import com.dmt.toeicapp.chatbot.entity.AiUsageLog;
import com.dmt.toeicapp.chatbot.repository.AiUsageLogRepository;
import com.dmt.toeicapp.chatbot.service.QuotaService;
import com.dmt.toeicapp.common.exception.AppException;
import com.dmt.toeicapp.user.entity.User;
import com.dmt.toeicapp.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Service
@Slf4j
public class QuotaServiceImpl implements QuotaService {

    private static final String REDIS_KEY_PREFIX = "ai:quota:";

    private final StringRedisTemplate redisTemplate;
    private final AiUsageLogRepository aiUsageLogRepository;
    private final UserRepository userRepository;
    private final int maxQuota;

    public QuotaServiceImpl(
            StringRedisTemplate redisTemplate,
            AiUsageLogRepository aiUsageLogRepository,
            UserRepository userRepository,
            @Value("${app.rate-limit.ai-max-quota-per-day:5}") int maxQuota) {
        this.redisTemplate = redisTemplate;
        this.aiUsageLogRepository = aiUsageLogRepository;
        this.userRepository = userRepository;
        this.maxQuota = maxQuota;
    }

    @Override
    public void checkAndIncrementQuota(Long userId, String prompt) {
        String key = REDIS_KEY_PREFIX + userId;

        try {
            String val = redisTemplate.opsForValue().get(key);

            if (val != null) {
                int current = Integer.parseInt(val);
                if (current >= maxQuota) {
                    log.warn("User ID {} reached AI generation limit ({} / {}). Rejecting request.", userId, current, maxQuota);
                    throw AppException.tooManyRequests(
                            "Bạn đã vượt quá giới hạn tạo flashcard bằng AI trong ngày (tối đa " + maxQuota + " lần/ngày).",
                            "AI_QUOTA_EXCEEDED"
                    );
                }
            }

            // Tăng counter atomic
            Long newCount = redisTemplate.opsForValue().increment(key);
            if (newCount != null && newCount == 1) {
                // Thiết lập TTL đến hết ngày (23:59:59)
                LocalDateTime now = LocalDateTime.now();
                LocalDateTime endOfDay = now.toLocalDate().atTime(LocalTime.MAX);
                Duration duration = Duration.between(now, endOfDay);
                redisTemplate.expire(key, duration);
            }
            log.info("User ID {} AI quota usage incremented: {}/{}", userId, newCount, maxQuota);
        } catch (AppException e) {
            throw e; // Ném lại lỗi quota đã vượt giới hạn
        } catch (Exception e) {
            log.error("Redis is down or unreachable. Bypassing quota check for user {}: {}", userId, e.getMessage());
        }
    }

    @Override
    @Transactional
    public void recordSuccess(Long userId, String prompt) {
        try {
            User user = userRepository.getReferenceById(userId);
            AiUsageLog logEntry = AiUsageLog.builder()
                    .user(user)
                    .prompt(prompt)
                    .status(AiUsageLog.Status.SUCCESS)
                    .build();
            aiUsageLogRepository.save(logEntry);
        } catch (Exception dbEx) {
            log.error("Failed to log successful AI request to database: {}", dbEx.getMessage());
        }
    }

    @Override
    @Transactional
    public void rollbackQuotaAndRecordFailure(Long userId, String prompt, String errorMsg) {
        String key = REDIS_KEY_PREFIX + userId;
        try {
            String val = redisTemplate.opsForValue().get(key);
            if (val != null) {
                int current = Integer.parseInt(val);
                if (current > 0) {
                    redisTemplate.opsForValue().decrement(key);
                    log.info("User ID {} AI quota rolled back due to error.", userId);
                }
            }
        } catch (Exception re) {
            log.error("Failed to rollback Redis quota for user ID {}: {}", userId, re.getMessage());
        }

        try {
            User user = userRepository.getReferenceById(userId);
            AiUsageLog logEntry = AiUsageLog.builder()
                    .user(user)
                    .prompt(prompt)
                    .status(AiUsageLog.Status.FAILED)
                    .errorMsg(errorMsg)
                    .build();
            aiUsageLogRepository.save(logEntry);
        } catch (Exception dbEx) {
            log.error("Failed to log failed AI request to database: {}", dbEx.getMessage());
        }
    }
}
