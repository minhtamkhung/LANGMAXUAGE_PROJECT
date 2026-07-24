package com.dmt.toeicapp.common.util;

import com.dmt.toeicapp.chatbot.dto.AiMultiLangTopicResponse;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class GeminiAiService {

    @Value("${app.google.gemini.api-key}")
    private String apiKey;

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    public GeminiAiService(WebClient webClient, ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.webClient = webClient.mutate()
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    public AiMultiLangTopicResponse generateMultiLangTopic(String userRequest) {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey;
        String prompt = buildPrompt(userRequest);
        Map<String, Object> requestBody = buildRequestBody(prompt);

        log.debug("[DEBUG] Calling Gemini API...");
        if (log.isDebugEnabled()) {
            String maskedKey = (apiKey == null ? "null" : (apiKey.length() > 8 ? apiKey.substring(0, 8) + "..." : "short-key"));
            log.debug("[DEBUG] Gemini API Key prefix: {}", maskedKey);
        }

        return callGeminiWithRetry(url, requestBody);
    }

    private AiMultiLangTopicResponse callGeminiWithRetry(String url, Map<String, Object> requestBody) {
        return webClient.post()
                .uri(url)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .timeout(Duration.ofSeconds(30))
                .map(this::parseResponse)
                .retryWhen(Retry.max(1)
                        .filter(throwable -> throwable instanceof UncheckedJsonMappingException)
                        .doBeforeRetry(retrySignal -> log.warn("Mapping JSON failed, retrying call to Gemini (Attempt: {})...", retrySignal.totalRetries() + 1))
                )
                .onErrorMap(throwable -> {
                    Throwable target = throwable;
                    if (throwable instanceof UncheckedJsonMappingException) {
                        target = throwable.getCause();
                    }
                    if (target instanceof RuntimeException) {
                        return (RuntimeException) target;
                    }
                    return new RuntimeException("Lỗi xử lý sinh Topic từ AI: " + target.getMessage(), target);
                })
                .block();
    }

    private AiMultiLangTopicResponse parseResponse(String rawBody) {
        try {
            JsonNode rootNode = objectMapper.readTree(rawBody);
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

            log.debug("[DEBUG] Gemini Raw Text: {}", rawText);

            String jsonText = rawText.trim();
            if (jsonText.startsWith("```")) {
                jsonText = jsonText.replaceAll("^```[a-zA-Z]*\\n?", "").replaceAll("```$", "").trim();
            }

            return objectMapper.readValue(jsonText, AiMultiLangTopicResponse.class);
        } catch (JsonMappingException e) {
            throw new UncheckedJsonMappingException(e);
        } catch (Exception e) {
            throw new RuntimeException(e.getMessage(), e);
        }
    }

    private String buildPrompt(String userRequest) {
        return """
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
    }

    private Map<String, Object> buildRequestBody(String prompt) {
        return Map.of(
                "contents", List.of(
                        Map.of(
                                "parts", List.of(
                                        Map.of("text", prompt)
                                )
                        )
                ),
                "generationConfig", Map.of(
                        "responseMimeType", "application/json"
                )
        );
    }

    private static class UncheckedJsonMappingException extends RuntimeException {
        public UncheckedJsonMappingException(JsonMappingException cause) {
            super(cause);
        }
    }
}