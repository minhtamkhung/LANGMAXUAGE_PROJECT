package com.dmt.toeicapp.typing.service;

import com.dmt.toeicapp.typing.dto.TypingStartRequest;
import com.dmt.toeicapp.typing.dto.TypingStartResponse;
import com.dmt.toeicapp.typing.dto.TypingSubmitRequest;
import com.dmt.toeicapp.typing.dto.TypingSubmitResponse;

public interface TypingService {

    /**
     * Khởi tạo phiên Typing Practice.
     * Random N flashcard từ topic, tạo bản ghi TypingSession, trả về danh sách card cho FE.
     *
     * @param request  Chứa topicId và cardCount
     * @param locale   Ngôn ngữ hiển thị định nghĩa (en / vi / ja / ko)
     * @return Danh sách card đã random + sessionId
     */
    TypingStartResponse start(TypingStartRequest request, String locale);

    /**
     * Chấm điểm và lưu kết quả phiên Typing Practice.
     * So sánh từng câu trả lời, tính accuracy, cập nhật TypingSession.
     *
     * @param request  Chứa sessionId + danh sách {flashcardId, typedAnswer}
     * @param locale   Ngôn ngữ dùng để lấy đáp án đúng từ FlashcardTranslation
     * @return Kết quả tổng hợp + chi tiết từng từ
     */
    TypingSubmitResponse submit(TypingSubmitRequest request, String locale);
}
