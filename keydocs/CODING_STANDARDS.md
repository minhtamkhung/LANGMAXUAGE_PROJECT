# Coding Standards

> Quy tắc code bắt buộc áp dụng xuyên suốt dự án.
> Mục tiêu: code nhất quán, dễ đọc, dễ test, đúng chuẩn doanh nghiệp.

---

## 1. SOLID Principles

### S — Single Responsibility
Mỗi class chỉ làm một việc. Nếu phải dùng "và" để mô tả class thì đó là dấu hiệu nên tách.

```java
// SAI — FlashcardService vừa lo business vừa lo upload ảnh
public class FlashcardServiceImpl implements FlashcardService {
    public FlashcardResponse create(FlashcardRequest req, MultipartFile image) {
        // upload ảnh lên Cloudinary...
        // lưu flashcard vào DB...
        // ghi audit log...
    }
}

// ĐÚNG — mỗi service lo một việc, inject nhau qua DI
@Service
@RequiredArgsConstructor
public class FlashcardServiceImpl implements FlashcardService {
    private final FlashcardRepository flashcardRepository;
    private final CloudinaryService   cloudinaryService;  // lo upload ảnh
    // AuditAspect lo ghi log — không cần inject ở đây

    public FlashcardResponse create(FlashcardRequest req, MultipartFile image) {
        String imageUrl = cloudinaryService.upload(image);
        // chỉ lo lưu flashcard
    }
}
```

### O — Open/Closed
Mở để mở rộng, đóng để sửa. Thêm tính năng mới → thêm class mới, không sửa class cũ.

```java
// Ví dụ: thêm quiz type mới không cần sửa QuizServiceImpl
public interface QuizStrategy {
    List<QuizOption> generateOptions(Flashcard card);
}

@Component
public class MultipleChoiceStrategy implements QuizStrategy { ... }

@Component
public class TrueFalseStrategy implements QuizStrategy { ... }

// Sau này thêm FillInStrategy — không đụng code cũ
@Component
public class FillInStrategy implements QuizStrategy { ... }
```

### L — Liskov Substitution
`FlashcardServiceImpl` phải thỏa mãn đúng contract của `FlashcardService`.
Không throw exception ngoài những gì interface đã cam kết.

### I — Interface Segregation
Không nhét hết vào một interface to. Tách nhỏ theo chức năng.

```java
// SAI — interface quá to, buộc implement những method không cần
public interface FlashcardService {
    FlashcardResponse getById(Long id);
    List<FlashcardResponse> getAll();
    FlashcardResponse create(FlashcardRequest req);
    void delete(Long id);
    void uploadImage(Long id, MultipartFile file);  // không liên quan
    void syncToElasticSearch();                      // không liên quan
}

// ĐÚNG — tách theo nhóm chức năng liên quan
public interface FlashcardService {
    FlashcardResponse getById(Long id);
    List<FlashcardResponse> getByTopic(Long topicId);
    FlashcardResponse create(FlashcardRequest req);
    FlashcardResponse update(Long id, FlashcardRequest req);
    void delete(Long id);
}

public interface FlashcardImageService {
    String uploadImage(Long flashcardId, MultipartFile file);
    void deleteImage(Long flashcardId);
}
```

### D — Dependency Inversion
High-level module không phụ thuộc vào low-level module. Cả hai phụ thuộc vào abstraction (interface).

```java
// Controller (high-level) → FlashcardService (interface/abstraction)
// FlashcardServiceImpl (low-level) → FlashcardRepository (interface/abstraction)
// Không bao giờ: Controller → FlashcardServiceImpl trực tiếp
```

---

## 2. Dependency Injection

### Bắt buộc: Constructor Injection

```java
// ĐÚNG — dùng @RequiredArgsConstructor của Lombok
@Service
@RequiredArgsConstructor
public class FlashcardServiceImpl implements FlashcardService {
    private final FlashcardRepository flashcardRepository;
    private final TopicRepository     topicRepository;
    private final CloudinaryService   cloudinaryService;
}

// SAI — field injection, không test được, che giấu dependency
@Service
public class FlashcardServiceImpl {
    @Autowired private FlashcardRepository flashcardRepository;
}

// SAI — setter injection, mutable, dễ gây NPE
@Service
public class FlashcardServiceImpl {
    private FlashcardRepository flashcardRepository;
    @Autowired
    public void setRepo(FlashcardRepository r) { this.flashcardRepository = r; }
}
```

> Lý do dùng constructor injection: dependency rõ ràng, immutable (`final`),
> dễ mock trong unit test, IntelliJ cảnh báo khi có circular dependency.

---

## 3. Service Layer Pattern

### Interface + Implementation (bắt buộc)

```java
// 1. Interface — định nghĩa contract
public interface FlashcardService {
    FlashcardResponse getById(Long id);
    Page<FlashcardResponse> getByTopic(Long topicId, Pageable pageable);
    FlashcardResponse create(FlashcardRequest request);
    FlashcardResponse update(Long id, FlashcardRequest request);
    void delete(Long id);
}

// 2. Implementation — thực thi business logic
@Service
@RequiredArgsConstructor
public class FlashcardServiceImpl implements FlashcardService {

    private final FlashcardRepository flashcardRepository;
    private final TopicRepository     topicRepository;
    private final FlashcardMapper     flashcardMapper;

    @Override
    public FlashcardResponse getById(Long id) {
        return flashcardRepository.findById(id)
                .map(flashcardMapper::toResponse)
                .orElseThrow(() -> AppException.notFound(
                        "Không tìm thấy flashcard với id = " + id));
    }
}
```

---

## 4. Repository Layer Pattern

### Chỉ dùng Interface extends JpaRepository

Spring Data JPA tự generate implementation — không viết Impl tay.

```java
// ĐÚNG
public interface FlashcardRepository extends JpaRepository<Flashcard, Long> {

    // Derived query — Spring tự generate SQL
    List<Flashcard> findByTopicIdAndIsActiveTrue(Long topicId);
    List<Flashcard> findByCreatedByAndIsActiveTrue(Long userId);
    Optional<Flashcard> findByIdAndIsActiveTrue(Long id);

    // JPQL — khi query phức tạp hơn
    @Query("""
        SELECT f FROM Flashcard f
        WHERE (f.topic.isSystem = true OR f.topic.createdBy.id = :userId)
          AND f.isActive = true
        ORDER BY f.createdAt DESC
        """)
    Page<Flashcard> findAccessibleByUser(@Param("userId") Long userId, Pageable pageable);
}
```

### Ngoại lệ: Custom Repository (chỉ khi cần Criteria API)

```java
// Chỉ dùng khi JPQL/derived query không đủ (dynamic filter phức tạp)
public interface FlashcardRepositoryCustom {
    Page<Flashcard> findWithDynamicFilter(FlashcardFilter filter, Pageable pageable);
}

public class FlashcardRepositoryCustomImpl implements FlashcardRepositoryCustom {
    @PersistenceContext private EntityManager em;

    @Override
    public Page<Flashcard> findWithDynamicFilter(FlashcardFilter filter, Pageable pageable) {
        // Criteria API...
    }
}

// Gộp vào repository chính
public interface FlashcardRepository
        extends JpaRepository<Flashcard, Long>, FlashcardRepositoryCustom {
}
```

---

## 5. Naming Conventions

### Class names

| Layer | Pattern | Ví dụ |
|-------|---------|-------|
| Controller | `{Feature}Controller` | `FlashcardController` |
| Service interface | `{Feature}Service` | `FlashcardService` |
| Service impl | `{Feature}ServiceImpl` | `FlashcardServiceImpl` |
| Repository | `{Entity}Repository` | `FlashcardRepository` |
| Entity | `{PascalCase}` | `Flashcard`, `UserProgress` |
| DTO Request | `{Feature}Request` | `FlashcardRequest` |
| DTO Response | `{Feature}Response` | `FlashcardResponse` |
| Mapper | `{Feature}Mapper` | `FlashcardMapper` |
| Exception | `AppException` | (dùng chung một class) |
| Aspect | `{Function}Aspect` | `LoggingAspect`, `AuditAspect` |

### Method names trong Service

| Hành động | Tên method |
|-----------|-----------|
| Lấy 1 theo id | `getById(Long id)` |
| Lấy danh sách | `getAll(Pageable p)` hoặc `getByTopic(...)` |
| Tạo mới | `create(Request req)` |
| Cập nhật | `update(Long id, Request req)` |
| Xóa | `delete(Long id)` |
| Kiểm tra tồn tại | `existsById(Long id)` |

### Packages

```
com.yourname.toeicapp.{feature}.{layer}
com.yourname.toeicapp.flashcard.service.FlashcardService
com.yourname.toeicapp.flashcard.service.FlashcardServiceImpl
com.yourname.toeicapp.common.response.ApiResponse
com.yourname.toeicapp.common.exception.AppException
```

---

## 6. Transaction Management

```java
// Service method thay đổi dữ liệu → @Transactional
@Override
@Transactional
public FlashcardResponse create(FlashcardRequest request) { ... }

@Override
@Transactional
public void delete(Long id) { ... }

// Service method chỉ đọc → @Transactional(readOnly = true)
// readOnly = true giúp Hibernate tối ưu, không tạo dirty check
@Override
@Transactional(readOnly = true)
public FlashcardResponse getById(Long id) { ... }

@Override
@Transactional(readOnly = true)
public Page<FlashcardResponse> getByTopic(Long topicId, Pageable pageable) { ... }
```

> Đặt `@Transactional` ở **Service**, không phải Controller hay Repository.

---

## 7. DTO — không expose Entity ra ngoài

```java
// SAI — trả Entity thẳng ra Controller → lộ thông tin nhạy cảm,
//        vòng lặp circular reference với Jackson, khó thay đổi schema
@GetMapping("/{id}")
public Flashcard getById(@PathVariable Long id) { ... }

// ĐÚNG — luôn map qua DTO trước khi trả về
@GetMapping("/{id}")
public ResponseEntity<ApiResponse<FlashcardResponse>> getById(@PathVariable Long id) {
    return ResponseEntity.ok(ApiResponse.ok(flashcardService.getById(id)));
}
```

Dùng **MapStruct** để map Entity ↔ DTO:

```java
@Mapper(componentModel = "spring")
public interface FlashcardMapper {
    FlashcardResponse toResponse(Flashcard flashcard);
    Flashcard toEntity(FlashcardRequest request);
}
```

---

## 8. Validation

Đặt validation constraint trên DTO Request, không validate trong Service:

```java
public record FlashcardRequest(

    @NotBlank(message = "Từ không được để trống")
    @Size(max = 200, message = "Từ tối đa 200 ký tự")
    String word,

    @NotBlank(message = "Định nghĩa không được để trống")
    String definition,

    @Size(max = 500)
    String exampleSentence,

    @Pattern(regexp = "EASY|MEDIUM|HARD", message = "Độ khó phải là EASY, MEDIUM hoặc HARD")
    String difficulty
) {}
```

Controller dùng `@Valid` để kích hoạt:

```java
@PostMapping
public ResponseEntity<ApiResponse<FlashcardResponse>> create(
        @Valid @RequestBody FlashcardRequest request) { ... }
// Nếu validation fail → GlobalExceptionHandler tự bắt và trả 400
```

---

*Cập nhật lần cuối: khởi tạo*
