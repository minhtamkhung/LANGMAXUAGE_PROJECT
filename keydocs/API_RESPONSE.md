# API Response Standard

> Quy chuẩn cấu trúc phản hồi cho toàn bộ REST API trong dự án.
> Áp dụng nhất quán ở mọi endpoint — không có ngoại lệ.

---

## Cấu trúc 3 lớp

```
ResponseEntity<ApiResponse<T>>
│
├── ResponseEntity      → tầng HTTP: status code (200, 201, 400, 404, 500...), headers
│
└── ApiResponse<T>      → tầng business: success/fail, message, error code
      │
      └── T (data)      → payload thực sự: FlashcardResponse, List<TopicResponse>, ...
```

`ResponseEntity` kiểm soát HTTP layer. `ApiResponse` kiểm soát business layer.
Frontend đọc HTTP status code trước, sau đó mới đọc body.

---

## Cấu trúc JSON

### Thành công

```json
{
  "success": true,
  "message": "Lấy flashcard thành công",
  "code": null,
  "data": {
    "id": 1,
    "word": "obtain",
    "definition": "to get or acquire something",
    "difficulty": "MEDIUM"
  }
}
```

### Thành công — danh sách

```json
{
  "success": true,
  "message": "OK",
  "code": null,
  "data": [
    { "id": 1, "word": "obtain" },
    { "id": 2, "word": "provide" }
  ]
}
```

### Thất bại — lỗi business (4xx)

```json
{
  "success": false,
  "message": "Không tìm thấy flashcard với id = 99",
  "code": "FLASHCARD_NOT_FOUND",
  "data": null
}
```

### Thất bại — lỗi validation

```json
{
  "success": false,
  "message": "Dữ liệu đầu vào không hợp lệ",
  "code": "VALIDATION_ERROR",
  "data": {
    "word": "Không được để trống",
    "definition": "Không được để trống"
  }
}
```

> `data` trong lỗi validation là `Map<String, String>` — field name → thông báo lỗi.
> Frontend dùng để hiển thị lỗi ngay dưới từng input.

---

## HTTP Status Code — bắt buộc dùng đúng

| Tình huống | HTTP Status | `success` |
|-----------|------------|---------|
| Lấy dữ liệu thành công | `200 OK` | true |
| Tạo mới thành công | `201 Created` | true |
| Xóa thành công (không trả data) | `204 No Content` | — |
| Dữ liệu đầu vào sai | `400 Bad Request` | false |
| Chưa đăng nhập | `401 Unauthorized` | false |
| Không có quyền | `403 Forbidden` | false |
| Không tìm thấy resource | `404 Not Found` | false |
| Lỗi server | `500 Internal Server Error` | false |

**Quy tắc quan trọng:** HTTP status và `success` field phải nhất quán.
Không bao giờ trả `200 OK` với `success: false` — frontend sẽ bị nhầm lẫn.

---

## Implementation

### `ApiResponse.java`

```java
package com.yourname.toeicapp.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)  // bỏ qua field null trong JSON output
public class ApiResponse<T> {

    private boolean success;
    private String  message;
    private String  code;     // error code — null khi success
    private T       data;     // payload — null khi error

    // ── Success factories ──────────────────────────────────────

    public static <T> ApiResponse<T> ok(T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message("OK")
                .data(data)
                .build();
    }

    public static <T> ApiResponse<T> ok(T data, String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .build();
    }

    public static <T> ApiResponse<T> created(T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message("Tạo mới thành công")
                .data(data)
                .build();
    }

    // ── Error factories ────────────────────────────────────────

    public static <T> ApiResponse<T> error(String message, String code) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .code(code)
                .build();
    }

    public static <T> ApiResponse<T> validationError(T fieldErrors) {
        return ApiResponse.<T>builder()
                .success(false)
                .message("Dữ liệu đầu vào không hợp lệ")
                .code("VALIDATION_ERROR")
                .data(fieldErrors)
                .build();
    }
}
```

> `@JsonInclude(NON_NULL)` — khi success thì JSON không có field `code`.
> Khi error thì không có field `data`. Output gọn hơn, không có `"code": null`.

### `AppException.java`

```java
package com.yourname.toeicapp.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class AppException extends RuntimeException {

    private final String     code;
    private final HttpStatus status;

    public AppException(String message, String code, HttpStatus status) {
        super(message);
        this.code   = code;
        this.status = status;
    }

    // ── Static factories cho từng loại lỗi phổ biến ───────────

    public static AppException notFound(String message) {
        return new AppException(message, "NOT_FOUND", HttpStatus.NOT_FOUND);
    }

    public static AppException forbidden(String message) {
        return new AppException(message, "FORBIDDEN", HttpStatus.FORBIDDEN);
    }

    public static AppException badRequest(String message, String code) {
        return new AppException(message, code, HttpStatus.BAD_REQUEST);
    }

    public static AppException conflict(String message, String code) {
        return new AppException(message, code, HttpStatus.CONFLICT);
    }
}
```

### `GlobalExceptionHandler.java`

```java
package com.yourname.toeicapp.common.exception;

import com.yourname.toeicapp.common.response.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    // ── AppException (business errors) ────────────────────────
    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiResponse<Void>> handleAppException(AppException ex) {
        log.warn("Business error: [{}] {}", ex.getCode(), ex.getMessage());
        return ResponseEntity
                .status(ex.getStatus())
                .body(ApiResponse.error(ex.getMessage(), ex.getCode()));
    }

    // ── Validation errors (@Valid) ─────────────────────────────
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidation(
            MethodArgumentNotValidException ex) {

        Map<String, String> errors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        f -> f.getDefaultMessage() != null ? f.getDefaultMessage() : "Invalid"
                ));

        return ResponseEntity
                .badRequest()
                .body(ApiResponse.validationError(errors));
    }

    // ── Catch-all (unexpected errors) ─────────────────────────
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneral(Exception ex) {
        log.error("Unexpected error", ex);
        return ResponseEntity
                .internalServerError()
                .body(ApiResponse.error("Đã xảy ra lỗi, vui lòng thử lại", "INTERNAL_ERROR"));
    }
}
```

### Dùng trong Controller

```java
@RestController
@RequestMapping("/api/flashcards")
@RequiredArgsConstructor
public class FlashcardController {

    private final FlashcardService flashcardService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<FlashcardResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.ok(flashcardService.getById(id))
        );
    }

    @PostMapping
    public ResponseEntity<ApiResponse<FlashcardResponse>> create(
            @Valid @RequestBody FlashcardRequest request) {
        return ResponseEntity.status(201).body(
                ApiResponse.created(flashcardService.create(request))
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        flashcardService.delete(id);
        return ResponseEntity.noContent().build();  // 204 — không cần body
    }
}
```

### Dùng trong Service — chỉ throw, không cần biết HTTP

```java
@Service
@RequiredArgsConstructor
public class FlashcardServiceImpl implements FlashcardService {

    private final FlashcardRepository flashcardRepository;

    @Override
    public FlashcardResponse getById(Long id) {
        Flashcard card = flashcardRepository.findById(id)
                .orElseThrow(() ->
                        AppException.notFound("Không tìm thấy flashcard với id = " + id));
        return mapper.toResponse(card);
    }
}
```

> Service không biết gì về HTTP status hay `ApiResponse`.
> Nó chỉ `throw AppException` — `GlobalExceptionHandler` tự lo phần còn lại.
> Đây là đúng nguyên tắc **Single Responsibility**.

---

## Error Code Convention

Đặt tên error code theo format: `{ENTITY}_{VERB}` hoặc `{ENTITY}_{ADJECTIVE}`

| Code | Ý nghĩa | HTTP |
|------|---------|------|
| `FLASHCARD_NOT_FOUND` | Không tìm thấy flashcard | 404 |
| `TOPIC_NOT_FOUND` | Không tìm thấy topic | 404 |
| `USER_NOT_FOUND` | Không tìm thấy user | 404 |
| `EMAIL_ALREADY_EXISTS` | Email đã được dùng | 409 |
| `USERNAME_ALREADY_EXISTS` | Username đã được dùng | 409 |
| `INVALID_CREDENTIALS` | Sai email/password | 401 |
| `TOKEN_EXPIRED` | JWT hết hạn | 401 |
| `TOKEN_INVALID` | JWT không hợp lệ | 401 |
| `ACCESS_DENIED` | Không có quyền thực hiện | 403 |
| `TOPIC_NOT_OWNED` | Topic không thuộc về user này | 403 |
| `VALIDATION_ERROR` | Dữ liệu đầu vào sai | 400 |
| `INTERNAL_ERROR` | Lỗi server không xác định | 500 |

---

*Cập nhật lần cuối: khởi tạo*
