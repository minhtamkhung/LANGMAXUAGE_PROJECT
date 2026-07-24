package com.dmt.toeicapp.typing.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * Response sau khi hoàn thành phiên Typing Practice.
 *
 * @param sessionId      ID phiên vừa kết thúc
 * @param topicName      Tên topic
 * @param totalCards     Tổng số thẻ trong phiên
 * @param correctCount   Số thẻ gõ đúng (so sánh không phân biệt hoa thường)
 * @param accuracy       Tỷ lệ chính xác (0.00 – 100.00)
 * @param durationSeconds Thời gian hoàn thành (giây)
 * @param details        Chi tiết từng câu — để FE hiển thị bảng kết quả
 */
public record TypingSubmitResponse(
        Long            sessionId,
        String          topicName,
        int             totalCards,
        int             correctCount,
        BigDecimal      accuracy,
        Integer         durationSeconds,
        List<WordResult> details
) {
    /**
     * Kết quả của một từ trong phiên.
     *
     * @param flashcardId  ID flashcard
     * @param word         Từ gốc cần gõ
     * @param typedAnswer  Câu trả lời người dùng gõ vào
     * @param correct      Đúng hay sai
     */
    public record WordResult(
            Long    flashcardId,
            String  word,
            String  typedAnswer,
            boolean correct
    ) {}
}
