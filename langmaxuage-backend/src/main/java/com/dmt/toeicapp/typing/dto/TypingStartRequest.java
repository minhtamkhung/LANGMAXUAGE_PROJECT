package com.dmt.toeicapp.typing.dto;

import jakarta.validation.constraints.NotNull;

/**
 * Request để bắt đầu phiên Typing Practice.
 * User chọn topic và số lượng thẻ muốn luyện (mặc định 10, tối đa 30).
 */
public record TypingStartRequest(

        @NotNull(message = "Topic không được để trống")
        Long topicId,

        Integer cardCount
) {
    public TypingStartRequest {
        if (cardCount == null) cardCount = 10;
        if (cardCount < 1)    cardCount = 1;
        if (cardCount > 30)   cardCount = 30;
    }
}
