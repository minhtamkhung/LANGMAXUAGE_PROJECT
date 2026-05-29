package com.dmt.toeicapp.progress.controller;

import com.dmt.toeicapp.common.response.ApiResponse;
import com.dmt.toeicapp.progress.dto.ProgressResponse;
import com.dmt.toeicapp.progress.dto.ReviewRequest;
import com.dmt.toeicapp.progress.service.ProgressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/progress")
@RequiredArgsConstructor
public class ProgressController {

    private final ProgressService progressService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<List<ProgressResponse>>> getMyProgress(
            @RequestParam(defaultValue = "en") String locale) {
        return ResponseEntity.ok(ApiResponse.ok(progressService.getMyProgress(locale)));
    }

    @GetMapping("/due")
    public ResponseEntity<ApiResponse<List<ProgressResponse>>> getDueCards(
            @RequestParam(defaultValue = "en") String locale) {
        return ResponseEntity.ok(ApiResponse.ok(progressService.getDueCards(locale)));
    }

    @PostMapping("/review")
    public ResponseEntity<ApiResponse<ProgressResponse>> review(
            @Valid @RequestBody ReviewRequest request,
            @RequestParam(defaultValue = "en") String locale) {
        return ResponseEntity.ok(ApiResponse.ok(progressService.review(request, locale)));
    }
}