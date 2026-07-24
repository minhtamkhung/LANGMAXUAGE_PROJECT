package com.dmt.toeicapp.typing.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/**
 * Request gửi lên khi user hoàn thành phiên Typing Practice.
 * Submit một lần duy nhất — toàn bộ câu trả lời cùng lúc.
 */
public record TypingSubmitRequest(

        @NotNull(message = "sessionId không được để trống")
        Long sessionId,

        /** Thời gian hoàn thành (giây) — FE tự tính từ lúc start đến lúc submit */
        Integer durationSeconds,

        @NotNull(message = "Danh sách câu trả lời không được để trống")
        @Valid
        List<AnswerItem> answers
) {
    public record AnswerItem(
            @NotNull(message = "flashcardId không được để trống")
            Long   flashcardId,

            /** Từ người dùng gõ vào — có thể null/rỗng nếu bỏ qua */
            String typedAnswer
    ) {}
}
