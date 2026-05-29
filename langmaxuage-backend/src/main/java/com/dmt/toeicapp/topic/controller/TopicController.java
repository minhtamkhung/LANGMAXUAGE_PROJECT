package com.dmt.toeicapp.topic.controller;

import com.dmt.toeicapp.common.response.ApiResponse;
import com.dmt.toeicapp.topic.dto.TopicRequest;
import com.dmt.toeicapp.topic.dto.TopicResponse;
import com.dmt.toeicapp.topic.service.TopicService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/topics")
@RequiredArgsConstructor
public class TopicController {

    private final TopicService topicService;

    // GET /api/topics?locale=vi
    @GetMapping
    public ResponseEntity<ApiResponse<List<TopicResponse>>> getAccessible(
            @RequestParam(defaultValue = "en") String locale) {
        return ResponseEntity.ok(
                ApiResponse.ok(topicService.getAccessible(locale))
        );
    }

    // GET /api/topics/1?locale=vi
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TopicResponse>> getById(
            @PathVariable Long id,
            @RequestParam(defaultValue = "en") String locale) {
        return ResponseEntity.ok(
                ApiResponse.ok(topicService.getById(id, locale))
        );
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TopicResponse>> create(
            @Valid @RequestBody TopicRequest request) {
        return ResponseEntity.status(201).body(
                ApiResponse.created(topicService.create(request))
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TopicResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody TopicRequest request) {
        return ResponseEntity.ok(
                ApiResponse.ok(topicService.update(id, request), "Cập nhật topic thành công")
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        topicService.delete(id);
        return ResponseEntity.noContent().build();
    }
}