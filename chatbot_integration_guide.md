# Hướng Dẫn Tích Hợp Chi Tiết Tính Năng Tạo Topic Bằng AI (Gemini)

Tài liệu này cung cấp các bước tích hợp hoàn chỉnh và chính xác để triển khai tính năng tự động tạo Topic và Flashcard đa ngôn ngữ bằng Gemini API vào dự án **LANGMAXUAGE_PROJECT (`toeicapp`)**.

Các phần mã nguồn đã được hiệu chỉnh để khắc phục hoàn toàn các vấn đề về biên dịch Java, cấu trúc request của Gemini API, ràng buộc database, và xử lý bất đồng bộ an toàn.

---

## 🏗️ 1. Quy Tắc Ánh Xạ Database Cần Tuân Thủ
Dự án sử dụng cơ chế bản dịch tách biệt. Do đó, quy trình lưu trữ cần tuân thủ cấu trúc sau:
1. **Bảng cha (`topics`, `flashcards`)**: Lưu giữ thông tin mặc định bằng tiếng Anh (`en`). Các cột `name` (trong `Topic`), `definition` (trong `Flashcard`) là bắt buộc (`NOT NULL`).
2. **Bảng dịch (`topic_translations`, `flashcard_translations`)**: Lưu giữ bản dịch cho các ngôn ngữ còn lại (`vi`, `ja`, `ko`).

---

## 🚀 2. Các Bước Triển Khai Phần Backend

### Bước 2.1 — Cấu hình API Key trong `application.yml`
Thêm cấu hình API Key cho Gemini vào file [application.yml](file:///d:/PROJECT_CANHAN/langmaxuage-backend/src/main/resources/application.yml) (hoặc file cấu hình môi trường tương ứng):

```yaml
google:
  gemini:
    api-key: ${GEMINI_API_KEY}
```

---

### Bước 2.2 — Tạo DTO Nhận Dữ Liệu AI
Tạo file [AiMultiLangTopicResponse.java](file:///d:/PROJECT_CANHAN/langmaxuage-backend/src/main/java/com/dmt/toeicapp/topic/dto/AiMultiLangTopicResponse.java). 

Các sub-record được lồng trực tiếp bên trong record chính để tránh lỗi biên dịch của Java khi khai báo nhiều lớp public ngang hàng trong cùng một file.

```java
package com.dmt.toeicapp.topic.dto;

import java.util.List;
import java.util.Map;

public record AiMultiLangTopicResponse(
    Map<String, TopicTranslationItem> topicTranslations,
    List<AiMultiLangFlashcardItem> flashcards
) {
    public record TopicTranslationItem(
        String name,
        String description
    ) {}

    public record AiMultiLangFlashcardItem(
        String word,
        String pronunciation,
        Map<String, FlashcardTranslationItem> flashcardTranslations
    ) {}

    public record FlashcardTranslationItem(
        String definition,
        String exampleSentence
    ) {}
}
```

---

### Bước 2.3 — Xây Dựng Service Gọi Gemini API
Tạo file [GeminiAiService.java](file:///d:/PROJECT_CANHAN/langmaxuage-backend/src/main/java/com/dmt/toeicapp/topic/service/impl/GeminiAiService.java).

**Các cải tiến quan trọng:**
* Khắc phục cấu trúc JSON Request Payload gửi đến Gemini API (sử dụng danh sách `List.of` cho `contents` và `parts`).
* Sử dụng `JsonNode` của Jackson giúp parse dữ liệu an toàn, hạn chế tối đa lỗi ép kiểu.
* Cấu hình tường minh yêu cầu về các ngôn ngữ `vi`, `en`, `ja`, `ko` trong phần prompt.

```java
package com.dmt.toeicapp.topic.service.impl;

import com.dmt.toeicapp.topic.dto.AiMultiLangTopicResponse;
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

    @Value("${google.gemini.api-key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper;

    public AiMultiLangTopicResponse generateMultiLangTopic(String userRequest) {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey;

        String systemInstruction = "Bạn là trợ lý học tập tiếng Anh thông minh. Hãy tạo một chủ đề từ vựng tiếng Anh TOEIC dựa trên yêu cầu của người học. "
                + "Bạn BẮT BUỘC phải tạo ra đầy đủ các bản dịch cho 4 ngôn ngữ sau: 'vi' (tiếng Việt), 'en' (tiếng Anh), 'ja' (tiếng Nhật), và 'ko' (tiếng Hàn) "
                + "trong cả phần mô tả chủ đề và nội dung flashcard.";

        String prompt = systemInstruction + "\nYêu cầu của người học: " + userRequest;

        // Xây dựng JSON schema cho đầu ra có cấu trúc (Structured Outputs)
        Map<String, Object> responseSchema = Map.of(
            "type", "OBJECT",
            "properties", Map.of(
                "topicTranslations", Map.of(
                    "type", "OBJECT",
                    "additionalProperties", Map.of(
                        "type", "OBJECT",
                        "properties", Map.of(
                            "name", Map.of("type", "STRING"),
                            "description", Map.of("type", "STRING")
                        ),
                        "required", List.of("name", "description")
                    )
                ),
                "flashcards", Map.of(
                    "type", "ARRAY",
                    "items", Map.of(
                        "type", "OBJECT",
                        "properties", Map.of(
                            "word", Map.of("type", "STRING"),
                            "pronunciation", Map.of("type", "STRING"),
                            "flashcardTranslations", Map.of(
                                "type", "OBJECT",
                                "additionalProperties", Map.of(
                                    "type", "OBJECT",
                                    "properties", Map.of(
                                        "definition", Map.of("type", "STRING"),
                                        "exampleSentence", Map.of("type", "STRING")
                                    ),
                                    "required", List.of("definition", "exampleSentence")
                                )
                            )
                        ),
                        "required", List.of("word", "pronunciation", "flashcardTranslations")
                    )
                )
            ),
            "required", List.of("topicTranslations", "flashcards")
        );

        // Khắc phục cấu trúc request payload (contents và parts phải là Array/List)
        Map<String, Object> requestBody = Map.of(
            "contents", List.of(
                Map.of(
                    "parts", List.of(
                        Map.of("text", prompt)
                    )
                )
            ),
            "generationConfig", Map.of(
                "responseMimeType", "application/json",
                "responseSchema", responseSchema
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

            String jsonText = candidates.get(0)
                    .path("content")
                    .path("parts")
                    .path(0)
                    .path("text")
                    .asText();

            return objectMapper.readValue(jsonText, AiMultiLangTopicResponse.class);

        } catch (Exception e) {
            throw new RuntimeException("Lỗi xử lý sinh Topic từ AI: " + e.getMessage(), e);
        }
    }
}
```

---

### Bước 2.4 — Triển Khai Xử Lý Giao Dịch Lưu Database
Tạo Service chuyên biệt để kết hợp logic gọi AI và lưu trữ thông tin có tính nguyên tử cao (`@Transactional`).

Tạo interface [AiTopicService.java](file:///d:/PROJECT_CANHAN/langmaxuage-backend/src/main/java/com/dmt/toeicapp/topic/service/AiTopicService.java):

```java
package com.dmt.toeicapp.topic.service;

import com.dmt.toeicapp.topic.dto.TopicResponse;

public interface AiTopicService {
    TopicResponse generateAndSaveTopic(String userRequest);
}
```

Tạo lớp hiện thực [AiTopicServiceImpl.java](file:///d:/PROJECT_CANHAN/langmaxuage-backend/src/main/java/com/dmt/toeicapp/topic/service/impl/AiTopicServiceImpl.java):

```java
package com.dmt.toeicapp.topic.service.impl;

import com.dmt.toeicapp.common.exception.AppException;
import com.dmt.toeicapp.common.security.SecurityUtils;
import com.dmt.toeicapp.flashcard.entity.Flashcard;
import com.dmt.toeicapp.flashcard.repository.FlashcardRepository;
import com.dmt.toeicapp.i18n.entity.FlashcardTranslation;
import com.dmt.toeicapp.i18n.entity.TopicTranslation;
import com.dmt.toeicapp.i18n.repository.FlashcardTranslationRepository;
import com.dmt.toeicapp.i18n.repository.TopicTranslationRepository;
import com.dmt.toeicapp.topic.dto.AiMultiLangTopicResponse;
import com.dmt.toeicapp.topic.dto.TopicResponse;
import com.dmt.toeicapp.topic.entity.Topic;
import com.dmt.toeicapp.topic.mapper.TopicMapper;
import com.dmt.toeicapp.topic.repository.TopicRepository;
import com.dmt.toeicapp.topic.service.AiTopicService;
import com.dmt.toeicapp.user.entity.User;
import com.dmt.toeicapp.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AiTopicServiceImpl implements AiTopicService {

    private final GeminiAiService geminiAiService;
    private final TopicRepository topicRepository;
    private final TopicTranslationRepository topicTranslationRepository;
    private final FlashcardRepository flashcardRepository;
    private final FlashcardTranslationRepository flashcardTranslationRepository;
    private final UserRepository userRepository;
    private final TopicMapper topicMapper;

    private static final String DEFAULT_LOCALE = "en";

    @Override
    @Transactional
    public TopicResponse generateAndSaveTopic(String userRequest) {
        // 1. Lấy thông tin user đăng nhập hiện tại
        Long currentUserId = SecurityUtils.getCurrentUserId();
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy người dùng hiện tại."));

        // 2. Gọi AI tạo dữ liệu đa ngôn ngữ
        AiMultiLangTopicResponse aiResponse = geminiAiService.generateMultiLangTopic(userRequest);

        // 3. Phân tách phần dữ liệu gốc tiếng Anh (en) cho thực thể cha
        AiMultiLangTopicResponse.TopicTranslationItem enTopic = aiResponse.topicTranslations().get(DEFAULT_LOCALE);
        if (enTopic == null) {
            // Trường hợp hy hữu AI thiếu bản dịch en, dùng bất kỳ ngôn ngữ nào có sẵn làm mặc định
            enTopic = aiResponse.topicTranslations().values().stream().findFirst()
                    .orElse(new AiMultiLangTopicResponse.TopicTranslationItem("AI Generated Topic", "Generated by AI"));
        }

        // 4. Lưu Topic gốc (tiếng Anh)
        Topic topic = Topic.builder()
                .name(enTopic.name())
                .description(enTopic.description())
                .createdBy(currentUser)
                .system(false) // Mặc định là cá nhân, không phải system
                .build();
        topic = topicRepository.save(topic);

        // 5. Lưu các bản dịch Topic sang các ngôn ngữ khác (vi, ja, ko)
        for (Map.Entry<String, AiMultiLangTopicResponse.TopicTranslationItem> entry : aiResponse.topicTranslations().entrySet()) {
            String locale = entry.getKey();
            if (DEFAULT_LOCALE.equalsIgnoreCase(locale)) continue; // Bỏ qua tiếng Anh vì đã lưu ở bảng cha

            TopicTranslation topicTranslation = TopicTranslation.builder()
                    .topic(topic)
                    .locale(locale)
                    .name(entry.getValue().name())
                    .description(entry.getValue().description())
                    .build();
            topicTranslationRepository.save(topicTranslation);
        }

        // 6. Duyệt và lưu Flashcards
        for (AiMultiLangTopicResponse.AiMultiLangFlashcardItem cardItem : aiResponse.flashcards()) {
            AiMultiLangTopicResponse.FlashcardTranslationItem enCard = cardItem.flashcardTranslations().get(DEFAULT_LOCALE);
            if (enCard == null) {
                enCard = cardItem.flashcardTranslations().values().stream().findFirst()
                        .orElse(new AiMultiLangTopicResponse.FlashcardTranslationItem("Definition not provided", "Example not provided"));
            }

            // Lưu Flashcard gốc (tiếng Anh)
            Flashcard flashcard = Flashcard.builder()
                    .topic(topic)
                    .createdBy(currentUser)
                    .word(cardItem.word())
                    .pronunciation(cardItem.pronunciation())
                    .definition(enCard.definition())
                    .exampleSentence(enCard.exampleSentence())
                    .active(true)
                    .build();
            flashcard = flashcardRepository.save(flashcard);

            // Lưu các bản dịch Flashcard sang các ngôn ngữ khác (vi, ja, ko)
            for (Map.Entry<String, AiMultiLangTopicResponse.FlashcardTranslationItem> entry : cardItem.flashcardTranslations().entrySet()) {
                String locale = entry.getKey();
                if (DEFAULT_LOCALE.equalsIgnoreCase(locale)) continue; // Bỏ qua tiếng Anh

                FlashcardTranslation cardTranslation = FlashcardTranslation.builder()
                        .flashcard(flashcard)
                        .locale(locale)
                        .definition(entry.getValue().definition())
                        .exampleSentence(entry.getValue().exampleSentence())
                        .createdBy(currentUser)
                        .build();
                flashcardTranslationRepository.save(cardTranslation);
            }
        }

        // 7. Trả về thông tin Topic vừa tạo dưới dạng mặc định (tiếng Anh)
        return topicMapper.toResponse(topic);
    }
}
```

---

### Bước 2.5 — Tạo API Endpoint (Controller)
Tạo file [AiTopicController.java](file:///d:/PROJECT_CANHAN/langmaxuage-backend/src/main/java/com/dmt/toeicapp/topic/controller/AiTopicController.java) để cung cấp cổng API cho Frontend:

```java
package com.dmt.toeicapp.topic.controller;

import com.dmt.toeicapp.common.response.ApiResponse;
import com.dmt.toeicapp.topic.dto.TopicResponse;
import com.dmt.toeicapp.topic.service.AiTopicService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiTopicController {

    private final AiTopicService aiTopicService;

    // POST /api/ai/generate-topic
    // Request Body: { "prompt": "Tên chủ đề hoặc gợi ý từ vựng" }
    @PostMapping("/generate-topic")
    public ResponseEntity<ApiResponse<TopicResponse>> generateTopic(@RequestBody Map<String, String> body) {
        String prompt = body.get("prompt");
        if (prompt == null || prompt.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Yêu cầu nhập nội dung mô tả chủ đề từ vựng."));
        }

        TopicResponse response = aiTopicService.generateAndSaveTopic(prompt);
        return ResponseEntity.ok(ApiResponse.ok(response, "Khởi tạo Topic và Flashcard bằng AI thành công."));
    }
}
```

---

## 🎨 3. Các Bước Triển Khai Phần Frontend

### Bước 3.1 — Tạo UI Tạo Topic Bằng AI
Cần xây dựng một Modal hoặc một Form nhập liệu trên giao diện React. Dưới đây là mẫu component viết bằng React giúp người dùng dễ dàng thao tác:

```jsx
import React, { useState } from 'react';
import axios from 'axios';

export default function AiTopicCreator({ onTopicCreated }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Giả định token JWT đã lưu trữ trong localStorage hoặc context
      const token = localStorage.getItem('token');
      const response = await axios.post(
        '/api/ai/generate-topic',
        { prompt },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data?.success) {
        setPrompt('');
        if (onTopicCreated) {
          onTopicCreated(response.data.data);
        }
        alert('Tạo Topic bằng AI thành công.');
      } else {
        setError(response.data?.message || 'Có lỗi xảy ra khi tạo.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể kết nối đến máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-md max-w-lg mx-auto">
      <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mb-2">
        <span>🤖</span> Sáng Tạo Topic Từ Vựng Bằng AI
      </h3>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
        Nhập nội dung mong muốn (Ví dụ: "TOEIC Airport vocabulary with 5 words"), mô hình AI sẽ tự động sinh chủ đề và bộ thẻ flashcard đa ngôn ngữ tương ứng.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
            placeholder="Mô tả chủ đề bạn muốn AI tạo..."
            className="w-full min-h-[100px] p-3 border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            required
          />
        </div>

        {error && (
          <div className="p-3 text-xs text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-400 rounded-lg">
            ⚠️ {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Đang tạo dữ liệu học tập...
            </>
          ) : (
            'Tạo Chủ Đề Bằng AI'
          )}
        </button>
      </form>
    </div>
  );
}
```

---

## 🛠️ 4. Kiểm Thử và Xác Minh Hoạt Động

### Bước 4.1 — Kiểm tra Biên dịch và Khởi chạy
1. Khởi tạo kho khóa môi trường `GEMINI_API_KEY` của bạn trên hệ điều hành trước khi khởi động Spring Boot.
2. Build và khởi động lại Backend Spring Boot:
   ```bash
   mvn clean install
   mvn spring-boot:run
   ```
3. Chạy môi trường Frontend để đảm bảo kết nối cục bộ.

### Bước 4.2 — Kiểm thử qua API (công cụ Postman / curl)
Gửi một request POST tới API Endpoint vừa tạo để kiểm chứng khả năng phản hồi trực tiếp:
```bash
curl -X POST http://localhost:8080/api/ai/generate-topic \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>" \
     -d '{"prompt": "Tạo bộ 3 từ vựng TOEIC chủ đề Restaurant"}'
```

### Bước 4.3 — Truy vấn Database Kiểm tra Tính Toàn Vẹn
Kiểm tra xem dữ liệu tiếng Anh đã nằm trong bảng cha và các bản dịch tiếng Việt, Nhật, Hàn có được lưu đúng bảng i18n không:
```sql
-- Kiểm tra topic
SELECT * FROM topics ORDER BY id DESC LIMIT 1;

-- Kiểm tra bản dịch của topic
SELECT * FROM topic_translations WHERE topic_id = (SELECT MAX(id) FROM topics);

-- Kiểm tra flashcards thuộc topic
SELECT * FROM flashcards WHERE topic_id = (SELECT MAX(id) FROM topics);

-- Kiểm tra bản dịch flashcard
SELECT * FROM flashcard_translations WHERE flashcard_id IN (
    SELECT id FROM flashcards WHERE topic_id = (SELECT MAX(id) FROM topics)
);
```

---
*Lưu ý:* Việc chia nhỏ các bước xử lý dữ liệu và sử dụng Transaction giúp hệ thống tự phục hồi trạng thái cũ hoàn toàn nếu xảy ra bất cứ sự cố mạng hoặc lỗi cú pháp JSON do AI sinh ra.
