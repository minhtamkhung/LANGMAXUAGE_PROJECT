# TOEIC Flashcard Web App — Project Decision Log

> File này ghi lại toàn bộ quyết định kỹ thuật, lý do chọn, và định hướng của dự án.
> Cập nhật mỗi khi có thay đổi lớn về thiết kế hoặc công nghệ.

---

## 1. Tổng quan dự án

| Mục | Chi tiết |
|-----|----------|
| Tên dự án | TOEIC Flashcard Web App |
| Mục tiêu | Học từ vựng & ngữ pháp TOEIC qua flashcard, quiz. Vừa để ôn thi vừa làm portfolio CV |
| Người dùng | Cá nhân (bản thân), có thể mở rộng ra nhiều user |
| Giai đoạn hiện tại | Planning / DB Design |

---

## 2. Tech Stack

### Backend
| Công nghệ | Lý do chọn |
|-----------|-----------|
| Java Spring Boot 3 | Đã học cơ bản, phổ biến trong doanh nghiệp VN |
| Spring Web | Xây dựng REST API |
| Spring Security + JWT | Authentication, phổ biến & thực tế |
| Spring Data JPA + Hibernate | ORM, tránh viết SQL thủ công |
| PostgreSQL | Relational DB, mạnh, free, phổ biến |
| Maven | Quản lý dependency |
| Lombok | Giảm boilerplate code |
| Redis | Lưu refresh token, cache session |
| Cloudinary | Lưu trữ ảnh flashcard trên cloud |

### Frontend
| Công nghệ | Lý do chọn |
|-----------|-----------|
| React + Vite | Combo phổ biến nhất doanh nghiệp hiện tại |
| Axios | Gọi REST API |
| React Router | Điều hướng trang |
| TailwindCSS | Styling nhanh (tùy chọn) |

> **Lý do KHÔNG dùng Thymeleaf:** Muốn tách biệt Frontend/Backend rõ ràng theo mô hình thực tế doanh nghiệp. Học REST API đúng chuẩn. Dễ mở rộng thành mobile app sau này.

### Tools
| Tool | Mục đích |
|------|---------|
| IntelliJ IDEA | IDE chính |
| Postman | Test REST API |
| Git + GitHub | Version control, thể hiện trên CV |
| Docker | Đóng gói, deploy |
| Render / Railway | Cloud deployment (free tier) |

---

## 3. Database Schema

### Nguyên tắc thiết kế
- **Soft delete** thay vì hard delete (`is_active` flag) — tránh mất dữ liệu, best practice doanh nghiệp
- **Thiết kế rộng vừa phải** — thêm cột dự phòng ở những chỗ gần chắc sẽ cần, không over-engineer
- **Không thêm** những bảng chưa chắc dùng (tags, comments, leaderboard...) — tránh phức tạp hóa MVP

### Các bảng

#### `users`
```sql
id            BIGINT PK
username      VARCHAR
email         VARCHAR UNIQUE
password_hash VARCHAR
role          VARCHAR        -- 'USER', 'ADMIN'
avatar_url    VARCHAR        -- dự phòng
is_active     BOOLEAN
created_at    TIMESTAMP
updated_at    TIMESTAMP
```

#### `topics`
```sql
id            BIGINT PK
name          VARCHAR        -- 'Business English', 'Grammar', 'Phrasal Verbs'...
description   TEXT
icon_url      VARCHAR        -- dự phòng cho thumbnail
display_order INT            -- thứ tự hiển thị (chỉ có ý nghĩa với system topic)
is_system     BOOLEAN        -- true = topic chính thức (ADMIN tạo, mọi user thấy)
                             -- false = topic cá nhân (user tự tạo, chỉ mình thấy)
created_by    BIGINT FK → users.id  -- ai tạo topic này
created_at    TIMESTAMP
updated_at    TIMESTAMP
```
> **Lý do tách `topics` riêng:** Nếu để `category` là string trong `flashcards` thì sau này muốn thêm ảnh, thứ tự, hay gắn quiz theo topic sẽ phải sửa nhiều chỗ.
>
> **Phân quyền topic theo `is_system` + `created_by`:**
>
> | is_system | created_by | Ai thấy? | Ai sửa/xóa? |
> |-----------|-----------|---------|------------|
> | true | ADMIN | Tất cả user | Chỉ ADMIN |
> | false | userId | Chỉ user đó | Chỉ user đó |
>
> Query lấy topic cho một user: `WHERE is_system = true OR created_by = :userId`
>
> **Không chọn cách thêm `user_id nullable`** vì query sẽ lộn xộn. Không chọn bảng riêng vì cùng bản chất là topic, tách ra chỉ phức tạp thêm.

#### `flashcards`
```sql
id               BIGINT PK
topic_id         BIGINT FK → topics.id
created_by       BIGINT FK → users.id   -- ADMIN (system topic) hoặc user (personal topic)
word             VARCHAR
pronunciation    VARCHAR        -- dự phòng cho audio/IPA
definition       TEXT
example_sentence TEXT
image_url        VARCHAR        -- Cloudinary URL (public_id hoặc secure_url)
difficulty       VARCHAR        -- 'EASY', 'MEDIUM', 'HARD'
is_active        BOOLEAN
created_at       TIMESTAMP
updated_at       TIMESTAMP
```
> **`created_by` trong flashcards:** Flashcard thuộc system topic thì chỉ ADMIN tạo. Flashcard thuộc personal topic thì user tự tạo và quản lý. Logic phân quyền kế thừa từ topic cha — không cần thêm flag riêng.

#### `user_progress`
```sql
id               BIGINT PK
user_id          BIGINT FK → users.id
flashcard_id     BIGINT FK → flashcards.id
status           VARCHAR        -- 'NEW', 'LEARNING', 'REVIEWING', 'MASTERED'
review_count     INT
correct_count    INT
last_reviewed_at TIMESTAMP
next_review_at   TIMESTAMP      -- SM-2 Spaced Repetition: ngày ôn tiếp theo
easiness_factor  FLOAT          -- SM-2: hệ số dễ/khó, mặc định 2.5
interval_days    INT            -- SM-2: số ngày đến lần review kế tiếp
sm2_repetitions  INT            -- SM-2: số lần liên tiếp trả lời đúng
```
> **SM-2 fields trong `user_progress`:** Thuật toán SM-2 (SuperMemo 2) — cùng thuật toán Anki dùng. Mỗi lần user trả lời, tính lại `easiness_factor`, `interval_days`, `next_review_at` dựa trên chất lượng câu trả lời (0–5). Thiết kế sẵn các cột này ngay từ đầu, không cần ALTER TABLE khi triển khai.

#### `quiz_attempts`
```sql
id               BIGINT PK
user_id          BIGINT FK → users.id
topic_id         BIGINT FK → topics.id
quiz_type        VARCHAR        -- 'MULTIPLE_CHOICE', 'TRUE_FALSE'...
total_questions  INT
correct_answers  INT
score            INT
duration_seconds INT
started_at       TIMESTAMP
finished_at      TIMESTAMP
```

#### `quiz_options`
```sql
id            BIGINT PK
flashcard_id  BIGINT FK → flashcards.id
option_text   VARCHAR
is_correct    BOOLEAN
```

#### `quiz_answers`
```sql
id                 BIGINT PK
attempt_id         BIGINT FK → quiz_attempts.id
flashcard_id       BIGINT FK → flashcards.id
selected_answer    VARCHAR
is_correct         BOOLEAN
time_spent_seconds INT
```
> **Lý do tách `quiz_attempts` + `quiz_answers`:** Dễ làm tính năng "xem lại câu sai" — chỉ cần `WHERE is_correct = false`. Nếu gộp lại sẽ rất khó query.

#### `audit_logs`
```sql
id           BIGINT PK
user_id      BIGINT FK → users.id   -- nullable (system action không có user)
action       VARCHAR                 -- 'CREATE', 'UPDATE', 'DELETE'
entity_type  VARCHAR                 -- 'FLASHCARD', 'TOPIC', 'USER'
entity_id    BIGINT                  -- id của object bị tác động
old_value    TEXT                    -- JSON snapshot trước khi thay đổi (nullable)
new_value    TEXT                    -- JSON snapshot sau khi thay đổi (nullable)
ip_address   VARCHAR                 -- dự phòng
created_at   TIMESTAMP
```
> **Lý do có bảng này:** `AuditAspect` tự động ghi vào đây mỗi khi ADMIN tạo/sửa/xóa — không cần ghi tay trong service. `old_value` + `new_value` lưu JSON snapshot nên biết chính xác field nào thay đổi.
>
> **Phân biệt log DB vs log file:**
> - `audit_logs` (DB) — sự kiện có ý nghĩa business: ai xóa flashcard nào, lúc nào. Cần query được, lưu lâu dài.
> - Application log (file/console, Logback) — `LoggingAspect`, `PerformanceAspect`. Mỗi request sinh hàng chục dòng, ghi DB sẽ làm chậm app, tốn storage vô ích.

**Ví dụ một row khi sửa flashcard:**
```json
{
  "action":      "UPDATE",
  "entity_type": "FLASHCARD",
  "entity_id":   42,
  "old_value":   "{\"word\": \"obtain\", \"definition\": \"to get something\"}",
  "new_value":   "{\"word\": \"obtain\", \"definition\": \"to get or acquire something\"}"
}
```

**Cách dùng trong service — chỉ cần thêm annotation:**
```java
@Auditable(action = "DELETE", entity = "FLASHCARD")
public void deleteFlashcard(Long id) {
    // AuditAspect tự lấy user từ SecurityContext và ghi vào audit_logs
    flashcardRepository.deleteById(id);
}
```

---

## 4. Roadmap

### Phase 1 — MVP (ước tính 2–3 tuần)
- [ ] Setup Spring Boot project
- [ ] CRUD API cho `flashcards` và `topics`
- [ ] Tích hợp Cloudinary: upload ảnh khi tạo/sửa flashcard
- [ ] Form nhập flashcard thủ công (ADMIN only)
- [ ] React frontend: hiển thị danh sách card, flip animation
- [ ] Test API bằng Postman
- [ ] Connect frontend ↔ backend

### Phase 2 — Auth + Progress (ước tính 2–3 tuần)
- [ ] Đăng ký / Đăng nhập với JWT
- [ ] Spring Security config
- [ ] Tích hợp Redis: lưu refresh token
- [ ] API track tiến độ (`user_progress`)
- [ ] Dashboard hiển thị tiến độ học

### Phase 3 — Polish + Deploy (ước tính 2 tuần)
- [ ] Quiz mode (trắc nghiệm 4 đáp án)
- [ ] Xem lại câu sai
- [ ] Implement thuật toán SM-2 cho Spaced Repetition
- [ ] Docker hóa ứng dụng (bao gồm Redis)
- [ ] Deploy lên Render hoặc Railway
- [ ] Viết README đẹp cho GitHub

---

## 5. API Design (dự kiến)

### Auth
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
```

### Topics
```
GET    /api/topics                  -- lấy system topics + personal topics của mình
GET    /api/topics/{id}
POST   /api/topics                  -- USER tạo personal topic, ADMIN tạo system topic
PUT    /api/topics/{id}             -- chỉ owner hoặc ADMIN
DELETE /api/topics/{id}             -- chỉ owner hoặc ADMIN
```

### Flashcards
```
GET    /api/flashcards               -- lấy flashcard từ system topics + personal topics của mình
GET    /api/flashcards/{id}
GET    /api/flashcards?topicId={id}
POST   /api/flashcards               -- ADMIN (system topic) hoặc USER (personal topic của mình)
PUT    /api/flashcards/{id}          -- chỉ owner hoặc ADMIN
DELETE /api/flashcards/{id}          -- chỉ owner hoặc ADMIN
POST   /api/flashcards/{id}/image    -- upload ảnh lên Cloudinary (owner hoặc ADMIN)
DELETE /api/flashcards/{id}/image    -- xóa ảnh trên Cloudinary (owner hoặc ADMIN)
```

### Progress & SM-2
```
GET    /api/progress/me
GET    /api/progress/due            — lấy danh sách card cần ôn hôm nay (SM-2)
POST   /api/progress/{flashcardId}/review  — gửi quality (0-5), tính lại SM-2
```

### Quiz
```
POST   /api/quiz/start
POST   /api/quiz/{attemptId}/answer
GET    /api/quiz/history
GET    /api/quiz/{attemptId}/review
```

---

## 6. Quyết định đã chốt

| Vấn đề | Quyết định | Lý do |
|--------|-----------|-------|
| Quản lý flashcard data | Nhập thủ công qua form (ADMIN) | Kiểm soát chất lượng nội dung, không cần import tool phức tạp |
| Spaced Repetition algorithm | SM-2 (SuperMemo 2) | Thuật toán Anki dùng, đã được chứng minh, implement không quá phức tạp |
| Image storage | Cloudinary | Free tier đủ dùng, có SDK Java, trả về URL dùng luôn, không tốn server storage |
| Refresh token storage | Redis | Nhanh, dễ set TTL tự động expire, revoke token dễ dàng, thể hiện kỹ năng trên CV |

## 6b. Ghi chú kỹ thuật các quyết định

### Cloudinary — cách hoạt động
```
User upload ảnh → Spring Boot nhận MultipartFile
→ Cloudinary SDK upload lên cloud
→ Cloudinary trả về { secure_url, public_id }
→ Lưu secure_url vào flashcards.image_url
→ Lưu public_id để sau này xóa ảnh (cần public_id để gọi destroy API)
```
- Dependency: `cloudinary-http44` (Java SDK)
- Config: `CLOUDINARY_URL` environment variable (dạng `cloudinary://api_key:api_secret@cloud_name`)

### Redis — lưu refresh token
```
Key:   "refresh_token:{userId}"     hoặc   "refresh_token:{tokenValue}"
Value: userId hoặc tokenValue
TTL:   = thời gian sống của refresh token (vd: 7 ngày)
```
- Khi logout hoặc refresh: xóa key khỏi Redis → token cũ vô hiệu ngay lập tức
- Dependency: `spring-boot-starter-data-redis`
- Local dev: chạy Redis qua Docker `docker run -p 6379:6379 redis`

### SM-2 Algorithm — logic cốt lõi
```
Sau mỗi lần user review, nhận quality q (0–5):
  0–2 = sai / quên     → reset interval về 1 ngày
  3   = đúng nhưng khó → interval không tăng
  4   = đúng           → interval tăng bình thường
  5   = dễ dàng        → interval tăng nhiều hơn

Công thức:
  new_EF = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
  new_EF = max(1.3, new_EF)   -- EF không được dưới 1.3

  if repetitions == 0: interval = 1
  if repetitions == 1: interval = 6
  else: interval = round(prev_interval * EF)

  next_review_at = now + interval days
```

---


## 7. Cấu trúc thư mục (Spring Boot)

### Quyết định: Package by Feature + Layer

| Kiểu | Nhận xét |
|------|---------|
| Package by Layer | Đơn giản, nhưng khi dự án lớn phải nhảy qua 5 folder để xem 1 tính năng |
| Package by Feature | Gom gọn theo tính năng, nhưng dễ mất ranh giới layer nếu không kỷ luật |
| **Package by Feature + Layer** ✓ | Best of both worlds — tính năng tách biệt, layer rõ ràng trong từng feature |

> **Lý do chọn Feature + Layer:** Dự án có đủ nhiều domain (flashcard, user, quiz, progress) để justify. Trông professional trên GitHub. Dễ mở rộng từng feature độc lập mà không đụng code feature khác.
>
> **Ghi chú package `common`:** Chỉ chứa những thứ dùng chung thật sự. Không để business logic vào đây.

```
src/
└── main/
    ├── java/com/yourname/toeicapp/
    │   │
    │   ├── flashcard/                        # Feature: Flashcard
    │   │   ├── controller/
    │   │   │   └── FlashcardController.java
    │   │   ├── service/
    │   │   │   ├── FlashcardService.java         # interface
    │   │   │   └── FlashcardServiceImpl.java     # implementation
    │   │   ├── repository/
    │   │   │   └── FlashcardRepository.java      # extends JpaRepository (không cần Impl)
    │   │   ├── entity/
    │   │   │   └── Flashcard.java
    │   │   ├── mapper/
    │   │   │   └── FlashcardMapper.java          # MapStruct: Entity ↔ DTO
    │   │   └── dto/
    │   │       ├── FlashcardRequest.java         # Java record
    │   │       └── FlashcardResponse.java        # Java record
    │   │
    │   ├── topic/                            # Feature: Topic
    │   │   ├── controller/
    │   │   │   └── TopicController.java
    │   │   ├── service/
    │   │   │   ├── TopicService.java             # interface
    │   │   │   └── TopicServiceImpl.java         # implementation
    │   │   ├── repository/
    │   │   │   └── TopicRepository.java
    │   │   ├── entity/
    │   │   │   └── Topic.java
    │   │   ├── mapper/
    │   │   │   └── TopicMapper.java
    │   │   └── dto/
    │   │       ├── TopicRequest.java
    │   │       └── TopicResponse.java
    │   │
    │   ├── user/                             # Feature: User + Auth
    │   │   ├── controller/
    │   │   │   ├── AuthController.java
    │   │   │   └── UserController.java
    │   │   ├── service/
    │   │   │   ├── AuthService.java              # interface
    │   │   │   ├── AuthServiceImpl.java
    │   │   │   ├── UserService.java              # interface
    │   │   │   └── UserServiceImpl.java
    │   │   ├── repository/
    │   │   │   └── UserRepository.java
    │   │   ├── entity/
    │   │   │   └── User.java                     # có enum Role bên trong
    │   │   ├── mapper/
    │   │   │   └── UserMapper.java
    │   │   └── dto/
    │   │       ├── LoginRequest.java
    │   │       ├── RegisterRequest.java
    │   │       ├── AuthResponse.java
    │   │       └── UserResponse.java
    │   │
    │   ├── progress/                         # Feature: SM-2 Progress tracking
    │   │   ├── controller/
    │   │   │   └── ProgressController.java
    │   │   ├── service/
    │   │   │   ├── ProgressService.java          # interface
    │   │   │   └── ProgressServiceImpl.java
    │   │   ├── repository/
    │   │   │   └── UserProgressRepository.java
    │   │   ├── entity/
    │   │   │   └── UserProgress.java
    │   │   ├── mapper/
    │   │   │   └── ProgressMapper.java
    │   │   └── dto/
    │   │       ├── ReviewRequest.java
    │   │       └── ProgressResponse.java
    │   │
    │   ├── quiz/                             # Feature: Quiz
    │   │   ├── controller/
    │   │   │   └── QuizController.java
    │   │   ├── service/
    │   │   │   ├── QuizService.java              # interface
    │   │   │   └── QuizServiceImpl.java
    │   │   ├── repository/
    │   │   │   ├── QuizAttemptRepository.java
    │   │   │   ├── QuizOptionRepository.java
    │   │   │   └── QuizAnswerRepository.java
    │   │   ├── entity/
    │   │   │   ├── QuizAttempt.java
    │   │   │   ├── QuizOption.java
    │   │   │   └── QuizAnswer.java
    │   │   ├── mapper/
    │   │   │   └── QuizMapper.java
    │   │   └── dto/
    │   │       ├── QuizStartRequest.java
    │   │       ├── QuizAnswerRequest.java
    │   │       └── QuizAttemptResponse.java
    │   │
    │   └── common/                           # Shared — dùng chung toàn app
    │       ├── config/
    │       │   ├── SecurityConfig.java           # Spring Security, CORS
    │       │   ├── RedisConfig.java
    │       │   └── CloudinaryConfig.java
    │       ├── security/
    │       │   ├── JwtUtil.java                  # generate & validate JWT
    │       │   ├── JwtAuthFilter.java            # filter đọc token từ header
    │       │   ├── UserDetailsServiceImpl.java   # load user từ DB cho Spring Security
    │       │   └── SecurityUtils.java            # static helper: getCurrentUser(), isAdmin()
    │       ├── aop/
    │       │   ├── LoggingAspect.java            # log method + thời gian → file
    │       │   ├── PerformanceAspect.java        # cảnh báo method > 500ms → file
    │       │   └── AuditAspect.java              # ghi CREATE/UPDATE/DELETE → audit_logs table
    │       ├── audit/
    │       │   ├── AuditLog.java                 # entity cho bảng audit_logs
    │       │   └── AuditLogRepository.java       # repository (extends JpaRepository)
    │       ├── exception/
    │       │   ├── AppException.java             # custom runtime exception (có code + HttpStatus)
    │       │   └── GlobalExceptionHandler.java   # @RestControllerAdvice — bắt mọi exception
    │       ├── response/
    │       │   └── ApiResponse.java              # wrapper: ResponseEntity<ApiResponse<T>>
    │       └── util/
    │           └── SM2Algorithm.java             # thuật toán SM-2, pure logic, không có @Component
    │
    └── resources/
        ├── application.yml                       # config chính, đọc từ env variable
        └── application-dev.yml                   # override cho local dev (trong .gitignore)
```

**Ghi chú quan trọng về từng package trong `common`:**

| Package | Chứa gì | Ghi chú |
|---------|---------|---------|
| `config/` | Bean config, SecurityConfig, CORS | `@Configuration` classes |
| `security/` | JWT logic, filter, SecurityUtils | Mọi thứ liên quan đến auth cơ sở hạ tầng |
| `aop/` | LoggingAspect, AuditAspect... | Cross-cutting concerns |
| `audit/` | AuditLog entity + repository | Tách riêng vì là data layer, không phải logic |
| `exception/` | AppException + GlobalExceptionHandler | Error handling tập trung |
| `response/` | ApiResponse wrapper | Chuẩn response cho toàn app |
| `util/` | SM2Algorithm, các helper thuần | Không có `@Component` — pure Java |

---

## 7b. AOP — Aspect-Oriented Programming

> Chi tiết đầy đủ xem tại: **`CODING_STANDARDS.md`**

### 3 Aspect trong dự án

| Aspect | Ghi output đến | Phase |
|--------|---------------|-------|
| `LoggingAspect` | File log (Logback) — log tên method + thời gian thực thi | Phase 1 |
| `PerformanceAspect` | File log (Logback) — WARN khi method > 500ms | Phase 1 |
| `AuditAspect` | Bảng `audit_logs` trong DB — ai làm gì, lúc nào, với object nào | Phase 2 |

> **Phân biệt:** Application log → file (debug, không cần lưu lâu). Audit log → DB (business event, cần query được).

### Cách dùng AuditAspect — chỉ thêm annotation

```java
@Auditable(action = "DELETE", entity = "FLASHCARD")
public void delete(Long id) {
    // AuditAspect tự lấy user từ SecurityContext, ghi vào audit_logs
    flashcardRepository.deleteById(id);
}
```

---

## 7c. Coding Standards

> Chi tiết đầy đủ xem tại: **`CODING_STANDARDS.md`** và **`API_RESPONSE.md`**

### Tóm tắt quyết định chốt

| Quyết định | Quy tắc |
|-----------|---------|
| Service layer | `{Feature}Service` (interface) + `{Feature}ServiceImpl` (class) — bắt buộc |
| Repository layer | Chỉ `interface extends JpaRepository` — Spring tự generate Impl |
| DI | Constructor injection + `@RequiredArgsConstructor` — cấm `@Autowired` field |
| API Response | `ResponseEntity<ApiResponse<T>>` — 3 lớp bọc nhau |
| Error handling | Service chỉ `throw AppException` — `GlobalExceptionHandler` lo HTTP status |
| Transaction | `@Transactional` ở Service — `readOnly = true` cho method chỉ đọc |
| DTO | Không expose Entity ra ngoài — luôn map qua DTO bằng MapStruct |
| Validation | `@Valid` trên DTO Request — không validate thủ công trong Service |
| Mapper | MapStruct — không dùng ModelMapper, không map tay trong Service |

## 8. Điểm nổi bật cho CV

Khi ghi vào CV, nhấn mạnh các điểm sau:

- Thiết kế và implement **REST API** với Spring Boot 3
- **JWT Authentication** + **Redis** để quản lý refresh token (revocation support)
- **Database design** với PostgreSQL (7 bảng, quan hệ rõ ràng)
- Tích hợp **Cloudinary** để upload và quản lý ảnh trên cloud
- Implement thuật toán **SM-2 (Spaced Repetition)** — cùng thuật toán Anki
- **Full-stack**: Spring Boot backend + React frontend
- **Containerize** với Docker (app + Redis)
- **Deploy** lên cloud với CI/CD
- Áp dụng **SOLID** principles xuyên suốt — Interface + Impl ở Service layer, constructor injection, Single Responsibility
- Áp dụng best practices: soft delete, DTO pattern, layered architecture, **AOP** (logging, audit)

---

*Cập nhật lần cuối: cập nhật cấu trúc thư mục đầy đủ theo code thực tế — thêm `mapper/`, `response/`, `audit/`, `JwtAuthFilter`, `SecurityUtils`, `PerformanceAspect`; gọn hoá 7b và 7c*
