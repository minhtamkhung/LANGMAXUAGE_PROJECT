# TOEIC Flashcard Web App — Project Flow

> Tài liệu này mô tả toàn bộ luồng hoạt động của hệ thống, từ kiến trúc tổng thể đến từng tính năng chi tiết.

---

## 1. Kiến trúc tổng thể

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite)                  │
│                        localhost:5173                           │
│                                                                 │
│  LanguageSelectionPage → LoginPage / RegisterPage → App         │
│       ↓                                                         │
│  AuthContext (JWT) + LanguageContext (locale)                   │
│       ↓                                                         │
│  Pages: Home | Topics | Flashcards | Study | Quiz | Profile     │
│       ↑↓ (Axios + interceptors)                                 │
└────────────────────┬────────────────────────────────────────────┘
                     │  HTTP REST API (JSON)
                     │  baseURL: http://localhost:8080/api
                     │
┌────────────────────▼────────────────────────────────────────────┐
│                   BACKEND (Spring Boot 3)                       │
│                   localhost:8080                                │
│                                                                 │
│  JwtAuthFilter → SecurityConfig → Controllers → Services        │
│                                        ↓                        │
│                                   Repositories                  │
│                                        ↓                        │
│  ┌──────────────┐   ┌──────────┐   ┌──────────────────────┐    │
│  │  PostgreSQL   │   │  Redis   │   │     Cloudinary       │    │
│  │  (main DB)   │   │ (tokens) │   │     (images)         │    │
│  └──────────────┘   └──────────┘   └──────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Flow Khởi động App (Frontend)

```
User mở app (/)
      │
      ▼
RootRedirect kiểm tra localStorage['appLocale']
      │
      ├── Chưa có locale ──→ /language (LanguageSelectionPage)
      │                           │
      │                    User chọn ngôn ngữ (EN/VI/...)
      │                           │
      │                    Lưu vào localStorage['appLocale']
      │                           │
      └── Đã có locale ───→ /home (HomePage)
                                  │
                            ProtectedRoute kiểm tra user
                                  │
                    ┌─────────────┴─────────────────┐
                    │                               │
               user tồn tại                   user = null
               → render page               → redirect /login
```

---

## 3. Flow Authentication

### 3.1 Đăng ký (Register)

```
Frontend: RegisterPage
      │
      ▼
authApi.register({ username, email, password })
      │
      ▼
POST /api/auth/register
      │
      ▼
AuthServiceImpl.register()
  ├── Kiểm tra email/username đã tồn tại chưa (throw AppException nếu trùng)
  ├── Encode password (BCrypt)
  ├── Lưu User vào PostgreSQL
  ├── Generate accessToken (JWT, 15 phút)
  ├── Generate refreshToken
  └── Lưu refreshToken vào Redis (TTL: 7 ngày)
      │
      ▼
Response: { accessToken, refreshToken, user }
      │
      ▼
AuthContext: lưu token vào localStorage, setUser(userData)
      │
      ▼
Redirect → /home
```

### 3.2 Đăng nhập (Login)

```
Frontend: LoginPage
      │
      ▼
authApi.login({ email, password })
      │
      ▼
POST /api/auth/login
      │
      ▼
AuthServiceImpl.login()
  ├── Tìm user theo email (throw INVALID_CREDENTIALS nếu không thấy)
  ├── So sánh password (BCrypt)
  ├── Generate accessToken (JWT)
  ├── Generate refreshToken
  └── Lưu refreshToken vào Redis
      │
      ▼
Response: { accessToken, refreshToken, user }
      │
      ▼
Redirect → /home
```

### 3.3 Auto Refresh Token (Axios Interceptor)

```
Frontend gửi request với accessToken
      │
      ▼
Server trả 401 (token hết hạn)
      │
      ▼
axiosInstance response interceptor bắt lỗi 401
      │
      ▼
POST /api/auth/refresh
  Header: X-Refresh-Token: <refreshToken>
      │
      ▼
AuthServiceImpl.refresh()
  ├── Kiểm tra refreshToken trong Redis
  ├── Generate accessToken mới
  └── Trả về accessToken mới
      │
      ▼
Lưu accessToken mới vào localStorage
      │
      ▼
Retry request gốc tự động
```

### 3.4 Đăng xuất (Logout)

```
User click Logout
      │
      ▼
AuthContext.logout()
      │
      ▼
POST /api/auth/logout (gửi refreshToken)
  └── Xóa refreshToken khỏi Redis (token bị thu hồi ngay lập tức)
      │
      ▼
Xóa accessToken + refreshToken khỏi localStorage
      |
      ▼
setUser(null) → ProtectedRoute redirect /login
```

---

## 4. Flow Request / Response (Mọi API Call)

```
Frontend (Axios)
      │
      │  Request interceptor: tự gắn Authorization: Bearer <token>
      ▼
Backend: JwtAuthFilter
  ├── Đọc token từ header
  ├── Validate JWT (chữ ký, thời hạn)
  └── Set SecurityContext (user + role)
      │
      ▼
Spring Security → kiểm tra permission (ROLE_USER / ROLE_ADMIN)
      │
      ▼
Controller → Service → Repository → PostgreSQL
      │
      ▼                   (song song)
AOP Aspects:
  ├── LoggingAspect     → ghi log thông tin method (file)
  ├── PerformanceAspect → cảnh báo nếu > 500ms (file)
  └── AuditAspect       → ghi CREATE/UPDATE/DELETE vào audit_logs (DB)
      │
      ▼
GlobalExceptionHandler (nếu có lỗi)
  ├── AppException   → trả HTTP 4xx + ApiResponse.error(...)
  ├── Validation     → trả HTTP 400 + map field errors
  └── Exception      → trả HTTP 500 + INTERNAL_ERROR
      │
      ▼
ResponseEntity<ApiResponse<T>>
  {
    "success": true/false,
    "message": "...",
    "code": null / "ERROR_CODE",
    "data": { ... }
  }
      │
      ▼
Frontend xử lý response
```

---

## 5. Flow Từng Tính Năng

### 5.1 Topics (Chủ đề)

```
/topics  →  TopicsPage
      │
      ▼
topicApi.getTopics({ locale })
GET /api/topics?locale=en
      │
      ▼
TopicServiceImpl.getTopics(userId, locale)
  └── Query: WHERE is_system = true OR created_by = :userId
      │
      ▼
Hiển thị danh sách Topics (system + personal của user)
      │
      ├── Click vào topic ─────────────────────────────────────────┐
      │                                                            ▼
      │                                                    /flashcards/:topicId
      │
      └── User tạo personal topic (POST /api/topics)
            └── Chỉ USER/ADMIN — lưu với created_by = userId, is_system = false
```

**Phân quyền Topic:**

| `is_system` | `created_by` | Ai thấy?      | Ai sửa/xóa?  |
|-------------|-------------|---------------|--------------|
| `true`      | ADMIN       | Tất cả user   | Chỉ ADMIN    |
| `false`     | userId      | Chỉ user đó   | Chỉ user đó  |

---

### 5.2 Flashcards

```
/flashcards/:topicId  →  FlashcardPage
      │
      ▼
flashcardApi.getByTopic(topicId, { locale })
GET /api/flashcards?topicId={id}&locale=en
      │
      ▼
FlashcardServiceImpl.getByTopic(topicId, locale, userId)
  └── Kiểm tra user có quyền xem topic này không
      │
      ▼
Hiển thị danh sách flashcards với flip animation
      │
      ├── Front: word + pronunciation + image
      └── Back: definition + example_sentence (ngôn ngữ theo locale)

Upload ảnh (ADMIN / owner):
  POST /api/flashcards/{id}/image
        │
        ▼
  Cloudinary SDK nhận MultipartFile
  → Upload lên Cloudinary cloud
  → Nhận { secure_url, public_id }
  → Lưu secure_url vào flashcards.image_url
```

---

### 5.3 Study Mode (SM-2 Spaced Repetition)

```
/study  →  StudyPage
      │
      ▼
progressApi.getDueCards()
GET /api/progress/due
      │
      ▼
ProgressServiceImpl.getDueCards(userId)
  └── Query: WHERE user_id = :userId AND next_review_at <= NOW()
      │
      ▼
User học từng card, đánh giá chất lượng (0–5):
  0–2 = Quên / Sai
  3   = Đúng nhưng khó
  4   = Đúng
  5   = Dễ dàng
      │
      ▼
POST /api/progress/{flashcardId}/review  (body: { quality: 4 })
      │
      ▼
SM2Algorithm.calculate(quality, currentProgress)
  ├── Tính new_EF (easiness factor): EF + (0.1 - (5-q)*(0.08 + (5-q)*0.02))
  ├── Tính new_interval:
  │     repetitions == 0 → interval = 1 ngày
  │     repetitions == 1 → interval = 6 ngày
  │     else             → interval = round(prev_interval * EF)
  └── Tính next_review_at = now + interval days
      │
      ▼
Cập nhật user_progress table
  { status, review_count, correct_count, last_reviewed_at,
    next_review_at, easiness_factor, interval_days, sm2_repetitions }
```

---

### 5.4 Quiz Mode

```
/quiz  →  QuizPage
      │
      ▼
User chọn topic + số câu hỏi + loại quiz
      │
      ▼
POST /api/quiz/start  { topicId, quizType, questionCount }
      │
      ▼
QuizServiceImpl.start()
  ├── Lấy ngẫu nhiên N flashcards từ topic
  ├── Tạo quiz_options (đáp án đúng + 3 sai ngẫu nhiên)
  └── Tạo quiz_attempts record
      │
      ▼
Response: { attemptId, questions: [{ flashcardId, options: [...] }] }
      │
      ▼
User trả lời từng câu:
POST /api/quiz/{attemptId}/answer  { flashcardId, selectedAnswer }
  └── Lưu vào quiz_answers { is_correct, time_spent_seconds }
      │
      ▼
Kết thúc quiz:
  └── Tính score, correct_answers, duration_seconds
  └── Cập nhật quiz_attempts.finished_at
      │
      ▼
GET /api/quiz/{attemptId}/review  — xem lại câu sai
  └── WHERE is_correct = false
```

---

### 5.5 Profile & User Management

```
/profile  →  ProfilePage
      │
      ▼
GET /api/users/me
  └── UserServiceImpl.getMe() → SecurityContext.getCurrentUser()
      │
      ▼
Hiển thị: username, email, avatar, role, join date
      │
      ├── Cập nhật profile
      │   PATCH /api/users/me  { username, avatarUrl }
      │
      └── Đổi mật khẩu
          PATCH /api/users/me/password  { oldPassword, newPassword }
            └── Verify oldPassword (BCrypt) → encode newPassword → save
```

---

## 6. Flow Đa ngôn ngữ (i18n)

```
LanguageSelectionPage
      │
      ▼
User chọn locale (EN / VI / JP / ...)
  └── Lưu vào localStorage['appLocale']
  └── LanguageContext.setLocale(locale)
      │
      ▼
Mọi API call flashcard/topic tự động gắn ?locale=en
      │
      ▼
GET /api/i18n/flashcards/{id}?locale=en
  └── i18nService.getTranslation(flashcardId, locale)
  └── Nếu không có translation → fallback về ngôn ngữ gốc (EN)
      │
      ▼
Frontend hiển thị nội dung theo locale đã chọn
      │
      ▼
User có thể đổi locale bất kỳ lúc nào (không reload trang)
→ LanguageContext cập nhật → các component re-render với locale mới
```

---

## 7. Cấu trúc Database (Entity Relationships)

```
users ──────────────────────────────────────────────────────┐
  │                                                         │
  │ created_by                                              │ user_id
  ▼                                                         ▼
topics ──────────────┐                              user_progress
  │ topic_id         │ topic_id                         └── flashcard_id ──┐
  ▼                  ▼                                                      │
flashcards ──── quiz_attempts                                               │
  │ flashcard_id     │ attempt_id                                           │
  ▼                  ▼                                                      │
quiz_options    quiz_answers ◄──────────────────────────────────────────────┘
                  └── flashcard_id

audit_logs
  └── user_id (nullable — system action không có user)
  └── entity_type: 'FLASHCARD' | 'TOPIC' | 'USER'
  └── old_value / new_value: JSON snapshot
```

---

## 8. Backend Layer Architecture (mỗi feature)

```
HTTP Request
      │
      ▼
Controller (@RestController)
  ├── @Valid validate DTO Request
  ├── Gọi Service
  └── Wrap kết quả vào ResponseEntity<ApiResponse<T>>
      │
      ▼
Service (interface + Impl)
  ├── Business logic
  ├── Kiểm tra quyền (SecurityUtils.getCurrentUser())
  ├── Gọi Repository
  ├── Map Entity → DTO (MapStruct mapper)
  └── throw AppException nếu lỗi (không handle HTTP ở đây)
      │
      ▼
Repository (extends JpaRepository)
  └── Spring Data tự generate SQL — không viết tay
      │
      ▼
Entity (PostgreSQL table)
```

---

## 9. Cross-Cutting Concerns (AOP)

```java
// Mọi method trong @Service được tự động bắt bởi AOP Aspects

@Auditable(action = "DELETE", entity = "FLASHCARD")
public void deleteFlashcard(Long id) { ... }
// → AuditAspect tự ghi vào audit_logs table

// LoggingAspect → log tên method + thời gian thực thi (file)
// PerformanceAspect → WARN nếu > 500ms (file)
```

| Aspect              | Output đến          | Mục đích                                  |
|---------------------|---------------------|-------------------------------------------|
| `LoggingAspect`     | File log (Logback)  | Trace tên method + thời gian              |
| `PerformanceAspect` | File log (Logback)  | Cảnh báo method chậm > 500ms             |
| `AuditAspect`       | `audit_logs` (DB)   | Ghi lại ai làm gì — dữ liệu business     |

---

## 10. Routing Frontend (React Router)

| Path                    | Page                   | Bảo vệ?   | Mô tả                            |
|-------------------------|------------------------|-----------|----------------------------------|
| `/language`             | LanguageSelectionPage  | ❌ Public | Chọn ngôn ngữ khi lần đầu vào    |
| `/login`                | LoginPage              | ❌ Public | Đăng nhập                        |
| `/register`             | LoginPage              | ❌ Public | Đăng ký                          |
| `/home`                 | HomePage               | ✅ Protected | Dashboard tổng quan             |
| `/topics`               | TopicsPage             | ✅ Protected | Danh sách chủ đề                |
| `/flashcards/:topicId`  | FlashcardPage          | ✅ Protected | Flashcard theo topic            |
| `/study`                | StudyPage              | ✅ Protected | Học theo SM-2                   |
| `/quiz`                 | QuizPage               | ✅ Protected | Quiz trắc nghiệm                |
| `/profile`              | ProfilePage            | ✅ Protected | Thông tin cá nhân               |

---

## 11. API Endpoints Tổng hợp

### Auth
| Method | Endpoint               | Mô tả                          |
|--------|------------------------|--------------------------------|
| POST   | `/api/auth/register`   | Đăng ký tài khoản              |
| POST   | `/api/auth/login`      | Đăng nhập, nhận JWT            |
| POST   | `/api/auth/refresh`    | Refresh accessToken            |
| POST   | `/api/auth/logout`     | Thu hồi refreshToken (Redis)   |
| GET    | `/api/auth/me`         | Lấy user hiện tại              |

### Users
| Method | Endpoint                 | Mô tả                          |
|--------|--------------------------|--------------------------------|
| GET    | `/api/users/me`          | Lấy thông tin bản thân         |
| PATCH  | `/api/users/me`          | Cập nhật profile               |
| PATCH  | `/api/users/me/password` | Đổi mật khẩu                  |

### Topics
| Method | Endpoint           | Mô tả                              |
|--------|--------------------|-------------------------------------|
| GET    | `/api/topics`      | Lấy system + personal topics        |
| GET    | `/api/topics/{id}` | Chi tiết topic                      |
| POST   | `/api/topics`      | Tạo topic (USER/ADMIN)              |
| PUT    | `/api/topics/{id}` | Sửa topic (owner/ADMIN)             |
| DELETE | `/api/topics/{id}` | Xóa topic (owner/ADMIN)             |

### Flashcards
| Method | Endpoint                        | Mô tả                              |
|--------|---------------------------------|-------------------------------------|
| GET    | `/api/flashcards`               | Lấy tất cả (system + personal)     |
| GET    | `/api/flashcards?topicId={id}`  | Lọc theo topic                      |
| GET    | `/api/flashcards/{id}`          | Chi tiết flashcard                  |
| POST   | `/api/flashcards`               | Tạo flashcard                       |
| PUT    | `/api/flashcards/{id}`          | Sửa flashcard                       |
| DELETE | `/api/flashcards/{id}`          | Xóa (soft delete)                   |
| POST   | `/api/flashcards/{id}/image`    | Upload ảnh → Cloudinary             |
| DELETE | `/api/flashcards/{id}/image`    | Xóa ảnh khỏi Cloudinary             |

### Progress (SM-2)
| Method | Endpoint                              | Mô tả                          |
|--------|---------------------------------------|--------------------------------|
| GET    | `/api/progress/me`                    | Tổng tiến độ học               |
| GET    | `/api/progress/due`                   | Cards cần ôn hôm nay           |
| POST   | `/api/progress/{flashcardId}/review`  | Submit quality (0–5), tính SM-2|

### Quiz
| Method | Endpoint                       | Mô tả                          |
|--------|--------------------------------|--------------------------------|
| POST   | `/api/quiz/start`              | Bắt đầu quiz mới               |
| POST   | `/api/quiz/{attemptId}/answer` | Trả lời câu hỏi                |
| GET    | `/api/quiz/history`            | Lịch sử quiz                   |
| GET    | `/api/quiz/{attemptId}/review` | Xem lại câu sai                |

---

## 12. Roadmap Giai đoạn

```
Phase 1 — MVP (Backend + Frontend cơ bản)
  ✅ Setup Spring Boot project
  ✅ CRUD API flashcards + topics
  ✅ React frontend: danh sách card, flip animation
  ✅ Connect frontend ↔ backend
  ✅ Cloudinary upload ảnh

Phase 2 — Auth + Progress
  ✅ Đăng ký / Đăng nhập với JWT
  ✅ Spring Security config
  ✅ Redis lưu refresh token
  ✅ API track tiến độ (user_progress)
  ✅ Dashboard tiến độ học
  ✅ Multi-language support (i18n)

Phase 3 — Polish + Deploy
  ⬜ Quiz mode hoàn chỉnh
  ⬜ Implement SM-2 algorithm
  ⬜ Docker hóa (app + Redis)
  ⬜ Deploy lên Render / Railway
  ⬜ README đẹp cho GitHub
```

---

*Cập nhật lần cuối: 2026-04-04 — phản ánh đúng code thực tế (React Router, AuthContext, i18n, SM-2 design)*
