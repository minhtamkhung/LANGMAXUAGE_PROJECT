    package com.dmt.toeicapp.chatbot.controller;

    import com.dmt.toeicapp.common.response.ApiResponse;
    import com.dmt.toeicapp.topic.dto.TopicResponse;
    import com.dmt.toeicapp.chatbot.dto.AiTopicRequest;
    import com.dmt.toeicapp.chatbot.service.AiTopicService;
    import jakarta.validation.Valid;
    import lombok.RequiredArgsConstructor;
    import org.springframework.http.ResponseEntity;
    import org.springframework.web.bind.annotation.*;

    @RestController
    @RequestMapping("/api/ai")
    @RequiredArgsConstructor
    public class AiTopicController {

        private final AiTopicService aiTopicService;

        // POST /api/ai/generate-topic
        @PostMapping("/generate-topic")
        public ResponseEntity<ApiResponse<TopicResponse>> generateTopic(
                @Valid @RequestBody AiTopicRequest request) {
            TopicResponse response = aiTopicService.generateAndSaveTopic(request.prompt());
            return ResponseEntity.ok(ApiResponse.ok(response, "Khởi tạo Topic và Flashcard bằng AI thành công."));
        }
    }