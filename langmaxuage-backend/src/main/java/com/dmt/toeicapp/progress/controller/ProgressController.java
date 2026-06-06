package com.dmt.toeicapp.progress.controller;

import com.dmt.toeicapp.common.response.ApiResponse;
import com.dmt.toeicapp.progress.dto.ProgressResponse;
import com.dmt.toeicapp.progress.dto.ReviewRequest;
import com.dmt.toeicapp.progress.service.ProgressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/progress")
@RequiredArgsConstructor
public class ProgressController {

    private final ProgressService progressService;

    /**
     * Lấy toàn bộ progress của user có phân trang.
     * GET /api/progress/me?page=0&size=20&sort=nextReviewAt,asc&locale=vi
     *
     * Mặc định: 20 card/trang, sắp xếp theo nextReviewAt (card sắp đến hạn lên đầu).
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<Page<ProgressResponse>>> getMyProgress(
            @RequestParam(defaultValue = "en") String locale,
            @PageableDefault(size = 20, sort = "nextReviewAt", direction = Sort.Direction.ASC)
            Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(progressService.getMyProgress(locale, pageable)));
    }

    /**
     * Lấy danh sách card đến hạn ôn hôm nay.
     * Không phân trang — tự nhiên giới hạn bởi ngày ôn (SM-2 scheduling).
     * GET /api/progress/due?locale=vi
     */
    @GetMapping("/due")
    public ResponseEntity<ApiResponse<List<ProgressResponse>>> getDueCards(
            @RequestParam(defaultValue = "en") String locale) {
        return ResponseEntity.ok(ApiResponse.ok(progressService.getDueCards(locale)));
    }

    /**
     * Ghi nhận kết quả ôn tập một card (SM-2 algorithm).
     * POST /api/progress/review?locale=vi
     */
    @PostMapping("/review")
    public ResponseEntity<ApiResponse<ProgressResponse>> review(
            @Valid @RequestBody ReviewRequest request,
            @RequestParam(defaultValue = "en") String locale) {
        return ResponseEntity.ok(ApiResponse.ok(progressService.review(request, locale)));
    }
}