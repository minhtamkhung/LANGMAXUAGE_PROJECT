package com.dmt.toeicapp.typing.dto;

import com.dmt.toeicapp.flashcard.dto.FlashcardResponse;

import java.util.List;

/**
 * Response trả về sau khi khởi tạo phiên Typing Practice.
 * FE dùng để hiển thị từng card theo thứ tự.
 *
 * @param sessionId  ID phiên — FE gửi lại khi submit kết quả
 * @param topicId    ID topic
 * @param topicName  Tên topic (đã localize nếu có)
 * @param cards      Danh sách card đã random — mỗi card gồm word, definition, pronunciation
 */
public record TypingStartResponse(
        Long                    sessionId,
        Long                    topicId,
        String                  topicName,
        List<FlashcardResponse> cards
) {}
