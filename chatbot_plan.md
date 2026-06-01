# 🤖 Kế Hoạch Tích Hợp Chatbot AI Tạo Topic Đa Ngôn Ngữ

## (Miễn Phí với Gemini API)

Tài liệu này mô tả kiến trúc hệ thống, cấu trúc dữ liệu và quy trình triển khai tính năng Chatbot AI tự động tạo Topic và Flashcard đa ngôn ngữ động cho dự án **LANGMAXUAGE_PROJECT (`toeicapp`)**.

---

# 🏗️ 1. Kiến Trúc Hệ Thống & Workflow

Hệ thống sử dụng mô hình:

* **Frontend-driven Prompting**
* Kết hợp với:

  * **Gemini API Structured Outputs**
  * **Spring Boot Backend**
  * **PostgreSQL i18n Database**

Mục tiêu:

* Miễn phí vận hành
* Tạo dữ liệu đa ngôn ngữ tự động
* Chỉ dùng **1 request AI**
* Đồng bộ hoàn toàn với hệ thống i18n hiện tại

---

# 🔄 Workflow Hoạt Động

## Bước 1 — User nhập yêu cầu

Ví dụ:

```txt
Tạo một topic từ vựng TOEIC về Airport gồm 5 từ
```

Frontend gửi request lên Backend.

---

## Bước 2 — Backend gọi Gemini API

Spring Boot:

* Nhận prompt từ Frontend
* Gắn thêm:

  * `responseSchema`
  * `responseMimeType = application/json`

Sau đó gửi request đến Gemini API.

---

## Bước 3 — Gemini sinh JSON đa ngôn ngữ

Gemini sẽ bị "ép" trả về JSON đúng schema:

```json
{
  "topicTranslations": {
    "vi": {},
    "en": {},
    "ja": {},
    "ko": {}
  },
  "flashcards": []
}
```

Toàn bộ dữ liệu đa ngôn ngữ được sinh ra chỉ trong:

* 1 request
* 1 response

---

## Bước 4 — Backend parse & lưu Database

Backend:

1. Parse JSON → DTO
2. Mapping DTO → Entity
3. Lưu:

   * Topic
   * Flashcard
   * TopicTranslation
   * FlashcardTranslation

---

# 📦 2. Cấu Trúc Dữ Liệu

## Database Structure

```txt
Topic
 ├── TopicTranslation (vi/en/ja/ko)

Flashcard
 ├── FlashcardTranslation (vi/en/ja/ko)
```

---

# 🚀 3. Các Bước Triển Khai

---

# Bước 1 — Tạo Gemini API Key

## Truy cập:

* Google AI Studio

## Thực hiện:

1. Đăng nhập Google
2. Chọn:

   * Create API Key
3. Copy API Key

---

## Cấu hình `application.yml`

```yaml
google:
  gemini:
    api-key: ${GEMINI_API_KEY}
```

---

# Bước 2 — Tạo DTO nhận dữ liệu AI

## File:

```txt
AiMultiLangTopicResponse.java
```

## Package:

```txt
com.dmt.toeicapp.topic.dto
```

---

## DTO Source Code

```java
package com.dmt.toeicapp.topic.dto;

import java.util.List;
import java.util.Map;

public record AiMultiLangTopicResponse(
    Map<String, TopicTranslationItem> topicTranslations,
    List<AiMultiLangFlashcardItem> flashcards
) {}

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
```

---

# Bước 3 — Triển khai Gemini AI Service

## File:

```txt
GeminiAiService.java
```

## Chức năng:

* Gọi Gemini API
* Ép JSON Schema
* Parse JSON response
* Convert → DTO

---

## Service Source Code

```java
package com.dmt.toeicapp.topic.service.impl;

import com.dmt.toeicapp.topic.dto.AiMultiLangTopicResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GeminiAiService {

    @Value("${google.gemini.api-key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper;

    public AiMultiLangTopicResponse generateMultiLangTopic(String userRequest) {

        String url =
            "https://generativelanguage.googleapis.com/v1beta/models/" +
            "gemini-1.5-flash:generateContent?key=" + apiKey;

        String prompt =
            "Tạo một chủ đề từ vựng tiếng Anh TOEIC theo yêu cầu: "
            + userRequest;

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
                        )
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
                                        "definition",
                                        Map.of("type", "STRING"),

                                        "exampleSentence",
                                        Map.of("type", "STRING")
                                    )
                                )
                            )
                        )
                    )
                )
            )
        );

        Map<String, Object> requestBody = Map.of(
            "contents",
            Map.of(
                "parts",
                Map.of("text", prompt)
            ),

            "generationConfig",
            Map.of(
                "responseMimeType", "application/json",
                "responseSchema", responseSchema
            )
        );

        try {

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity =
                new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response =
                restTemplate.postForEntity(
                    url,
                    entity,
                    String.class
                );

            Map<?, ?> responseMap =
                objectMapper.readValue(response.getBody(), Map.class);

            List<?> candidates =
                (List<?>) responseMap.get("candidates");

            Map<?, ?> firstCandidate =
                (Map<?, ?>) candidates.get(0);

            Map<?, ?> content =
                (Map<?, ?>) firstCandidate.get("content");

            List<?> parts =
                (List<?>) content.get("parts");

            Map<?, ?> firstPart =
                (Map<?, ?>) parts.get(0);

            String jsonText =
                (String) firstPart.get("text");

            return objectMapper.readValue(
                jsonText,
                AiMultiLangTopicResponse.class
            );

        } catch (Exception e) {

            throw new RuntimeException(
                "Lỗi xử lý AI đa ngôn ngữ: " + e.getMessage()
            );
        }
    }
}
```

---

# Bước 4 — Mapping & Lưu Database

## Quy trình lưu dữ liệu

### 1. Tạo Topic

```txt
Topic
```

* Lưu Topic
* Lấy `topicId`

---

### 2. Lưu TopicTranslation

Duyệt:

```java
topicTranslations
```

Tạo:

```txt
TopicTranslation
```

Cho từng locale:

* vi
* en
* ja
* ko

---

### 3. Tạo Flashcard

Duyệt danh sách:

```java
flashcards
```

Tạo:

```txt
Flashcard
```

Gắn:

```txt
topicId
```

---

### 4. Lưu FlashcardTranslation

Duyệt:

```java
flashcardTranslations
```

Tạo:

```txt
FlashcardTranslation
```

Lưu:

* definition
* exampleSentence
* locale

---

# 🎯 4. Ưu Điểm & Điểm Đột Phá

---

## 💰 Miễn phí hoàn toàn

Sử dụng:

```txt
Gemini Free Tier
```

Hỗ trợ khoảng:

```txt
~1500 requests/day
```

Phù hợp:

* Demo
* Đồ án
* MVP
* Chấm điểm môn học

---

## ⚡ Tối ưu hiệu năng

Thay vì:

* dịch từng từ
* gọi nhiều API translation

Hệ thống chỉ cần:

```txt
1 request AI duy nhất
```

---

## 🌍 Đa ngôn ngữ đồng bộ

Hỗ trợ:

* 🇻🇳 Vietnamese
* 🇺🇸 English
* 🇯🇵 Japanese
* 🇰🇷 Korean

Dễ mở rộng thêm:

* Chinese
* French
* German
* Thai
* ...

---

## 🧩 Tương thích hoàn toàn hệ thống i18n

Thiết kế khớp 100% với:

* PostgreSQL schema hiện tại
* bảng translation hiện có
* cơ chế locale dynamic của toeicapp

---

# 🧠 Tổng Kết

Giải pháp AI này giúp hệ thống:

* Tạo topic tự động
* Sinh flashcard đa ngôn ngữ
* Giảm công nhập liệu
* Không tốn chi phí vận hành
* Tăng trải nghiệm học tập cá nhân hóa

Đồng thời vẫn:

* dễ maintain
* dễ scale
* dễ mở rộng AI trong tương lai
