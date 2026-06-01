package com.dmt.toeicapp.common.util;

import com.dmt.toeicapp.chatbot.dto.AiMultiLangTopicResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GeminiAiService {

    @Value("${app.google.gemini.api-key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper;

    public AiMultiLangTopicResponse generateMultiLangTopic(String userRequest) {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey;

        // Nhúng định dạng JSON mong muốn trực tiếp vào prompt để AI bắt buộc trả về đúng cấu trúc
        String prompt = """
                Bạn là trợ lý học tập tiếng Anh thông minh. Hãy tạo một chủ đề từ vựng tiếng Anh TOEIC dựa trên yêu cầu của người học.
                Bạn BẮT BUỘC phải tạo ra đầy đủ các bản dịch cho 4 ngôn ngữ sau: 'vi' (tiếng Việt), 'en' (tiếng Anh), 'ja' (tiếng Nhật), và 'ko' (tiếng Hàn) trong cả phần mô tả chủ đề và nội dung flashcard.
                
                Yêu cầu của người học: %s
                
                BẮT BUỘC trả về kết quả là một JSON object hợp lệ theo đúng định dạng sau, không thêm bất kỳ văn bản hay markdown nào:
                {
                  "topicTranslations": [
                    { "locale": "en", "name": "...", "description": "..." },
                    { "locale": "vi", "name": "...", "description": "..." },
                    { "locale": "ja", "name": "...", "description": "..." },
                    { "locale": "ko", "name": "...", "description": "..." }
                  ],
                  "flashcards": [
                    {
                      "word": "...",
                      "pronunciation": "/.../ (adj/n/v)",
                      "flashcardTranslations": [
                        { "locale": "en", "definition": "...", "exampleSentence": "..." },
                        { "locale": "vi", "definition": "...", "exampleSentence": "..." },
                        { "locale": "ja", "definition": "...", "exampleSentence": "..." },
                        { "locale": "ko", "definition": "...", "exampleSentence": "..." }
                      ]
                    }
                  ]
                }
                """.formatted(userRequest);

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of(
                                "parts", List.of(
                                        Map.of("text", prompt)
                                )
                        )
                )
        );

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

            if (response.getStatusCode() != HttpStatus.OK || response.getBody() == null) {
                throw new RuntimeException("Lỗi kết nối tới Gemini API: " + response.getStatusCode());
            }

            JsonNode rootNode = objectMapper.readTree(response.getBody());
            JsonNode candidates = rootNode.path("candidates");
            if (candidates.isMissingNode() || candidates.isEmpty()) {
                throw new RuntimeException("Gemini API không trả về nội dung hợp lệ (có thể do bộ lọc an toàn).");
            }

            String rawText = candidates.get(0)
                    .path("content")
                    .path("parts")
                    .path(0)
                    .path("text")
                    .asText();

            // Làm sạch text: loại bỏ markdown code block nếu có (```json ... ```)
            String jsonText = rawText.trim();
            if (jsonText.startsWith("```")) {
                jsonText = jsonText.replaceAll("^```[a-zA-Z]*\\n?", "").replaceAll("```$", "").trim();
            }

            return objectMapper.readValue(jsonText, AiMultiLangTopicResponse.class);

        } catch (Exception e) {
            throw new RuntimeException("Lỗi xử lý sinh Topic từ AI: " + e.getMessage(), e);
        }
    }
}