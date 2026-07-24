package com.dmt.toeicapp.typing.controller;

import com.dmt.toeicapp.common.response.ApiResponse;
import com.dmt.toeicapp.typing.dto.*;
import com.dmt.toeicapp.typing.service.TypingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/typing")
@RequiredArgsConstructor
public class TypingController {

    private final TypingService typingService;

    /**
     * Khởi tạo phiên Typing Practice.
     * POST /api/typing/start?locale=vi
     * Body: { "topicId": 1, "cardCount": 10 }
     *
     * Returns 201 Created với danh sách card đã random và sessionId.
     */
    @PostMapping("/start")
    public ResponseEntity<ApiResponse<TypingStartResponse>> start(
            @Valid @RequestBody TypingStartRequest request,
            @RequestParam(defaultValue = "en") String locale) {
        return ResponseEntity.status(201).body(
                ApiResponse.created(typingService.start(request, locale))
        );
    }

    /**
     * Nộp kết quả phiên Typing Practice (submit một lần cuối buổi).
     * POST /api/typing/submit?locale=vi
     * Body: { "sessionId": 1, "durationSeconds": 120, "answers": [...] }
     *
     * Returns 200 OK với accuracy, correctCount, và chi tiết từng từ.
     */
    @PostMapping("/submit")
    public ResponseEntity<ApiResponse<TypingSubmitResponse>> submit(
            @Valid @RequestBody TypingSubmitRequest request,
            @RequestParam(defaultValue = "en") String locale) {
        return ResponseEntity.ok(
                ApiResponse.ok(typingService.submit(request, locale), "Nộp bài thành công!")
        );
    }
}
