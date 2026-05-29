package com.dmt.toeicapp.common.util;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;

/**
 * Thuật toán SM-2 (SuperMemo 2) — cùng thuật toán Anki dùng.
 * Pure logic, không có @Component — gọi static method trực tiếp.
 *
 * Quality q (0–5):
 *   0 = hoàn toàn không nhớ
 *   1 = sai, nhưng khi thấy đáp án thì nhớ ra
 *   2 = sai, nhưng đáp án có vẻ quen
 *   3 = đúng, nhưng phải nghĩ nhiều
 *   4 = đúng, chỉ do dự một chút
 *   5 = đúng ngay, không do dự
 */
public final class SM2Algorithm {

    private SM2Algorithm() {}

    private static final BigDecimal MIN_EF      = new BigDecimal("1.3");
    private static final BigDecimal INITIAL_EF  = new BigDecimal("2.5");

    /**
     * Tính toán kết quả SM-2 sau mỗi lần review.
     *
     * @param quality       chất lượng trả lời (0–5)
     * @param repetitions   số lần liên tiếp trả lời đúng hiện tại
     * @param easinessFactor hệ số dễ/khó hiện tại
     * @param intervalDays  số ngày interval hiện tại
     * @return Result chứa các giá trị mới
     */
    public static Result calculate(int quality,
                                   int repetitions,
                                   BigDecimal easinessFactor,
                                   int intervalDays) {
        validateQuality(quality);

        // Tính EF mới
        // new_EF = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
        BigDecimal q         = BigDecimal.valueOf(quality);
        BigDecimal diff      = BigDecimal.valueOf(5).subtract(q);
        BigDecimal penalty   = diff.multiply(
                new BigDecimal("0.08").add(diff.multiply(new BigDecimal("0.02")))
        );
        BigDecimal newEF = easinessFactor
                .add(new BigDecimal("0.1"))
                .subtract(penalty)
                .setScale(2, RoundingMode.HALF_UP);

        // EF không được dưới 1.3
        newEF = newEF.max(MIN_EF);

        // Tính interval mới và repetitions mới
        int newRepetitions;
        int newInterval;

        if (quality < 3) {
            // Sai — reset về đầu
            newRepetitions = 0;
            newInterval    = 1;
        } else {
            // Đúng — tăng dần
            newRepetitions = repetitions + 1;
            if (repetitions == 0) {
                newInterval = 1;
            } else if (repetitions == 1) {
                newInterval = 6;
            } else {
                // interval = round(prev_interval * EF)
                newInterval = (int) Math.round(intervalDays * newEF.doubleValue());
            }
        }

        OffsetDateTime nextReviewAt = OffsetDateTime.now().plusDays(newInterval);

        return new Result(newRepetitions, newEF, newInterval, nextReviewAt);
    }

    private static void validateQuality(int quality) {
        if (quality < 0 || quality > 5) {
            throw new IllegalArgumentException(
                    "Quality phải từ 0 đến 5, nhận được: " + quality);
        }
    }

    /**
     * Record chứa kết quả tính toán SM-2.
     */
    public record Result(
            int             newRepetitions,
            BigDecimal      newEasinessFactor,
            int             newIntervalDays,
            OffsetDateTime  nextReviewAt
    ) {}
}