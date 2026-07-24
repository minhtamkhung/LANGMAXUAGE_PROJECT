package com.dmt.toeicapp.matching.controller;

import com.dmt.toeicapp.common.response.ApiResponse;
import com.dmt.toeicapp.matching.dto.*;
import com.dmt.toeicapp.matching.service.MatchingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/matching")
@RequiredArgsConstructor
public class MatchingController {

    private final MatchingService matchingService;

    /**
     * Khởi tạo phiên Matching Game.
     * POST /api/matching/start?locale=vi
     * Body: { "topicId": 1, "pairCount": 8 }
     *
     * Returns 201 Created với sessionId cùng danh sách words và definitions đã xáo trộn.
     */
    @PostMapping("/start")
    public ResponseEntity<ApiResponse<MatchingStartResponse>> start(
            @Valid @RequestBody MatchingStartRequest request,
            @RequestParam(defaultValue = "en") String locale) {
        return ResponseEntity.status(201).body(
                ApiResponse.created(matchingService.start(request, locale))
        );
    }

    /**
     * Nộp kết quả phiên Matching Game.
     * POST /api/matching/submit?locale=vi
     * Body: { "sessionId": 1, "durationSeconds": 45, "pairs": [...] }
     *
     * Returns 200 OK với accuracy, correctPairs, và các thông tin thống kê.
     */
    @PostMapping("/submit")
    public ResponseEntity<ApiResponse<MatchingSubmitResponse>> submit(
            @Valid @RequestBody MatchingSubmitRequest request,
            @RequestParam(defaultValue = "en") String locale) {
        return ResponseEntity.ok(
                ApiResponse.ok(matchingService.submit(request, locale), "Nộp kết quả Matching thành công!")
        );
    }
}
