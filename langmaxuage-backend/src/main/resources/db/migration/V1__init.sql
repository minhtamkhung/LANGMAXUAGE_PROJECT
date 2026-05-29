-- =============================================================
-- TOEIC Flashcard App — PostgreSQL Schema
-- =============================================================
-- Thứ tự tạo bảng: users → topics → flashcards → user_progress
--                  → quiz_attempts → quiz_options → quiz_answers
--                  → audit_logs
-- =============================================================

-- Extension để dùng gen_random_uuid() nếu cần sau này
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -------------------------------------------------------------
-- 1. USERS
-- -------------------------------------------------------------
CREATE TABLE users (
                       id            BIGSERIAL       PRIMARY KEY,
                       username      VARCHAR(50)     NOT NULL UNIQUE,
                       email         VARCHAR(255)    NOT NULL UNIQUE,
                       password_hash VARCHAR(255)    NOT NULL,
                       role          VARCHAR(20)     NOT NULL DEFAULT 'USER'
                           CHECK (role IN ('USER', 'ADMIN')),
                       avatar_url    VARCHAR(500),
                       is_active     BOOLEAN         NOT NULL DEFAULT TRUE,
                       created_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
                       updated_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------------
-- 2. TOPICS
-- -------------------------------------------------------------
CREATE TABLE topics (
                        id            BIGSERIAL       PRIMARY KEY,
                        name          VARCHAR(100)    NOT NULL,
                        description   TEXT,
                        icon_url      VARCHAR(500),
                        display_order INT             NOT NULL DEFAULT 0,
                        is_system     BOOLEAN         NOT NULL DEFAULT FALSE,
    -- TRUE  = ADMIN tạo, tất cả user thấy
    -- FALSE = user tạo, chỉ mình thấy
                        created_by    BIGINT          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
                        created_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
                        updated_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------------
-- 3. FLASHCARDS
-- -------------------------------------------------------------
CREATE TABLE flashcards (
                            id               BIGSERIAL       PRIMARY KEY,
                            topic_id         BIGINT          NOT NULL REFERENCES topics(id) ON DELETE RESTRICT,
                            created_by       BIGINT          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
                            word             VARCHAR(200)    NOT NULL,
                            pronunciation    VARCHAR(200),
                            definition       TEXT            NOT NULL,
                            example_sentence TEXT,
                            image_url        VARCHAR(500),   -- Cloudinary secure_url
                            image_public_id  VARCHAR(200),   -- Cloudinary public_id (dùng để xóa ảnh)
                            difficulty       VARCHAR(10)     NOT NULL DEFAULT 'MEDIUM'
                                CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
                            is_active        BOOLEAN         NOT NULL DEFAULT TRUE,
                            created_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
                            updated_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------------
-- 4. USER_PROGRESS  (SM-2 Spaced Repetition)
-- -------------------------------------------------------------
CREATE TABLE user_progress (
                               id               BIGSERIAL       PRIMARY KEY,
                               user_id          BIGINT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                               flashcard_id     BIGINT          NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
                               status           VARCHAR(20)     NOT NULL DEFAULT 'NEW'
                                   CHECK (status IN ('NEW', 'LEARNING', 'REVIEWING', 'MASTERED')),
                               review_count     INT             NOT NULL DEFAULT 0,
                               correct_count    INT             NOT NULL DEFAULT 0,
    -- SM-2 fields
                               easiness_factor  NUMERIC(4,2)    NOT NULL DEFAULT 2.50, -- min 1.3
                               interval_days    INT             NOT NULL DEFAULT 1,
                               sm2_repetitions  INT             NOT NULL DEFAULT 0,
                               last_reviewed_at TIMESTAMPTZ,
                               next_review_at   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
                               UNIQUE (user_id, flashcard_id)   -- mỗi user chỉ có 1 progress record per flashcard
);

-- -------------------------------------------------------------
-- 5. QUIZ_ATTEMPTS
-- -------------------------------------------------------------
CREATE TABLE quiz_attempts (
                               id               BIGSERIAL       PRIMARY KEY,
                               user_id          BIGINT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                               topic_id         BIGINT          REFERENCES topics(id) ON DELETE SET NULL,
                               quiz_type        VARCHAR(30)     NOT NULL DEFAULT 'MULTIPLE_CHOICE'
                                   CHECK (quiz_type IN ('MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_IN')),
                               total_questions  INT             NOT NULL DEFAULT 0,
                               correct_answers  INT             NOT NULL DEFAULT 0,
                               score            INT             NOT NULL DEFAULT 0,  -- 0-100
                               duration_seconds INT,
                               started_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
                               finished_at      TIMESTAMPTZ
);

-- -------------------------------------------------------------
-- 6. QUIZ_OPTIONS  (các đáp án cho mỗi flashcard)
-- -------------------------------------------------------------
CREATE TABLE quiz_options (
                              id            BIGSERIAL       PRIMARY KEY,
                              flashcard_id  BIGINT          NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
                              option_text   VARCHAR(500)    NOT NULL,
                              is_correct    BOOLEAN         NOT NULL DEFAULT FALSE
);

-- -------------------------------------------------------------
-- 7. QUIZ_ANSWERS  (chi tiết từng câu trả lời trong 1 attempt)
-- -------------------------------------------------------------
CREATE TABLE quiz_answers (
                              id                 BIGSERIAL       PRIMARY KEY,
                              attempt_id         BIGINT          NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
                              flashcard_id       BIGINT          NOT NULL REFERENCES flashcards(id) ON DELETE RESTRICT,
                              selected_answer    VARCHAR(500),   -- nullable nếu user bỏ qua
                              is_correct         BOOLEAN         NOT NULL DEFAULT FALSE,
                              time_spent_seconds INT
);

-- -------------------------------------------------------------
-- 8. AUDIT_LOGS  (ghi bởi AuditAspect — không ghi tay)
-- -------------------------------------------------------------
CREATE TABLE audit_logs (
                            id           BIGSERIAL       PRIMARY KEY,
                            user_id      BIGINT          REFERENCES users(id) ON DELETE SET NULL, -- nullable
                            action       VARCHAR(20)     NOT NULL
                                CHECK (action IN ('CREATE', 'UPDATE', 'DELETE')),
    entity_type  VARCHAR(50)     NOT NULL, -- 'FLASHCARD', 'TOPIC', 'USER'
    entity_id    BIGINT          NOT NULL,
    old_value    TEXT,           -- JSON snapshot trước thay đổi
    new_value    TEXT,           -- JSON snapshot sau thay đổi
    ip_address   VARCHAR(45),    -- IPv4 hoặc IPv6
    created_at   TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- =============================================================
-- INDEXES
-- =============================================================

-- topics: hay query theo is_system và created_by
CREATE INDEX idx_topics_is_system     ON topics(is_system);
CREATE INDEX idx_topics_created_by    ON topics(created_by);

-- flashcards: hay filter theo topic, created_by, is_active
CREATE INDEX idx_flashcards_topic_id   ON flashcards(topic_id);
CREATE INDEX idx_flashcards_created_by ON flashcards(created_by);
CREATE INDEX idx_flashcards_is_active  ON flashcards(is_active);

-- user_progress: hay query "card nào cần ôn hôm nay" (SM-2)
CREATE INDEX idx_progress_user_id        ON user_progress(user_id);
CREATE INDEX idx_progress_next_review    ON user_progress(user_id, next_review_at);
CREATE INDEX idx_progress_status         ON user_progress(user_id, status);

-- quiz_attempts: lịch sử quiz theo user
CREATE INDEX idx_quiz_attempts_user_id   ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_answers_attempt_id ON quiz_answers(attempt_id);

-- audit_logs: tra cứu theo entity hoặc user
CREATE INDEX idx_audit_entity  ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_user_id ON audit_logs(user_id);

-- =============================================================
-- I18N — Đa ngôn ngữ
-- =============================================================
-- =============================================================
-- 9. SUPPORTED_LOCALES — danh sách ngôn ngữ hỗ trợ
-- =============================================================
CREATE TABLE supported_locales (
                                   code          VARCHAR(10)  PRIMARY KEY,  -- 'vi', 'en', 'ja', ...
                                   name          VARCHAR(50)  NOT NULL,
                                   native_name   VARCHAR(50)  NOT NULL,
                                   is_default    BOOLEAN      NOT NULL DEFAULT FALSE,
                                   is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
                                   display_order INT          NOT NULL DEFAULT 0,
                                   created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- chỉ 1 locale mặc định
CREATE UNIQUE INDEX idx_locales_default
    ON supported_locales(is_default)
    WHERE is_default = TRUE;

-- filter locale đang active
CREATE INDEX idx_locales_active
    ON supported_locales(is_active);

-- =============================================================
-- 10. FLASHCARD_TRANSLATIONS
-- =============================================================
CREATE TABLE flashcard_translations (
                                        id               BIGSERIAL      PRIMARY KEY,
                                        flashcard_id     BIGINT         NOT NULL
                                            REFERENCES flashcards(id) ON DELETE CASCADE,
                                        locale           VARCHAR(10)    NOT NULL
                                            REFERENCES supported_locales(code),
                                        definition       TEXT           NOT NULL,
                                        example_sentence TEXT,
                                        created_by       BIGINT
                                                                        REFERENCES users(id) ON DELETE SET NULL,
                                        created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
                                        updated_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

    -- mỗi flashcard chỉ có 1 bản dịch / locale
                                        CONSTRAINT uq_flashcard_locale UNIQUE (flashcard_id, locale)
);

-- index cho query theo locale (admin / filter)
CREATE INDEX idx_flashcard_trans_locale
    ON flashcard_translations(locale);

-- =============================================================
-- 11. TOPIC_TRANSLATIONS
-- =============================================================
CREATE TABLE topic_translations (
                                    id           BIGSERIAL      PRIMARY KEY,
                                    topic_id     BIGINT         NOT NULL
                                        REFERENCES topics(id) ON DELETE CASCADE,
                                    locale       VARCHAR(10)    NOT NULL
                                        REFERENCES supported_locales(code),
                                    name         VARCHAR(100)   NOT NULL,
                                    description  TEXT,
                                    created_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
                                    updated_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

                                    CONSTRAINT uq_topic_locale UNIQUE (topic_id, locale)
);

-- index cho filter theo locale
CREATE INDEX idx_topic_trans_locale
    ON topic_translations(locale);
-- =============================================================
-- SEED DATA FOR TOEIC FLASHCARD APP
-- Đảm bảo đã chạy file Schema trước khi chạy file này.
-- =============================================================

BEGIN;

-- -------------------------------------------------------------
-- 1. USERS (10 users)
-- -------------------------------------------------------------
INSERT INTO users (username, email, password_hash, role, avatar_url)
VALUES
    ('admin_main', 'admin@toeic.com', '$2a$12$R.S1', 'ADMIN', 'https://ui-avatars.com/api/?name=Admin'),
    ('teacher_ha', 'ha.nguyen@edu.vn', '$2a$12$R.S2', 'ADMIN', 'https://ui-avatars.com/api/?name=Ha+Nguyen'),
    ('john_doe', 'john@gmail.com', '$2a$12$R.S3', 'USER', 'https://ui-avatars.com/api/?name=John+Doe'),
    ('minh_tuan', 'tuan.m@fpt.com', '$2a$12$R.S4', 'USER', 'https://ui-avatars.com/api/?name=Minh+Tuan'),
    ('akiko_chan', 'akiko@yahoo.jp', '$2a$12$R.S5', 'USER', 'https://ui-avatars.com/api/?name=Akiko'),
    ('lee_min', 'leemin@naver.com', '$2a$12$R.S6', 'USER', 'https://ui-avatars.com/api/?name=Lee+Min'),
    ('sara_smith', 'sara@outlook.com', '$2a$12$R.S7', 'USER', 'https://ui-avatars.com/api/?name=Sara'),
    ('hoang_anh', 'anh.hoang@student.com', '$2a$12$R.S8', 'USER', 'https://ui-avatars.com/api/?name=Hoang+Anh'),
    ('dev_test', 'tester@dev.com', '$2a$12$R.S9', 'USER', 'https://ui-avatars.com/api/?name=Tester'),
    ('guest_01', 'guest@toeic.com', '$2a$12$R.S10', 'USER', 'https://ui-avatars.com/api/?name=Guest');

-- -------------------------------------------------------------
-- 2. SUPPORTED LOCALES (4 locales)
-- -------------------------------------------------------------
INSERT INTO supported_locales (code, name, native_name, is_default, display_order)
VALUES
    ('vi', 'Vietnamese', 'Tiếng Việt', TRUE, 1),
    ('en', 'English', 'English', FALSE, 2),
    ('ja', 'Japanese', '日本語', FALSE, 3),
    ('ko', 'Korean', '한국어', FALSE, 4);

-- -------------------------------------------------------------
-- 3. TOPICS (10 topics)
-- -------------------------------------------------------------
INSERT INTO topics (name, description, display_order, is_system, created_by)
VALUES
    ('Office Life', 'Daily activities in the office', 1, TRUE, 1),
    ('Business Trip', 'Travel for work purposes', 2, TRUE, 1),
    ('Healthcare', 'Medical terms and hospital visits', 3, TRUE, 1),
    ('Shopping & Retail', 'Purchasing and store management', 4, TRUE, 1),
    ('Grammar: Tenses', 'All 12 tenses in English', 5, TRUE, 2),
    ('Grammar: Passive Voice', 'Formal structures for TOEIC', 6, TRUE, 2),
    ('Technology & IT', 'Software, hardware and innovation', 7, TRUE, 1),
    ('Banking & Finance', 'Money, stock and investment', 8, TRUE, 1),
    ('Eating Out', 'Restaurants and food services', 9, TRUE, 2),
    ('My Personal Vocab', 'User custom collection', 10, FALSE, 3);

-- -------------------------------------------------------------
-- 4. FLASHCARDS (15 cards)
-- -------------------------------------------------------------
INSERT INTO flashcards (topic_id, created_by, word, pronunciation, definition, example_sentence, difficulty)
VALUES
    (1, 1, 'Collaborate', '/kəˈlæbəreɪt/', 'To work with another person or group', 'We need to collaborate on this project.', 'MEDIUM'),
    (1, 1, 'Postpone', '/poʊstˈpoʊn/', 'To delay an event until a later time', 'The meeting was postponed until Friday.', 'EASY'),
    (2, 1, 'Itinerary', '/aɪˈtɪnəreri/', 'A detailed plan for a journey', 'Please check your travel itinerary carefully.', 'HARD'),
    (3, 1, 'Prescription', '/prɪˈskrɪpʃn/', 'A piece of paper on which a doctor writes medicine', 'The pharmacist filled my prescription.', 'MEDIUM'),
    (4, 1, 'Refund', '/ˈriːfʌnd/', 'A sum of money that is paid back to you', 'I would like to request a full refund.', 'EASY'),
    (8, 1, 'Mortgage', '/ˈmɔːrɡɪdʒ/', 'A loan to purchase a home', 'They applied for a 30-year mortgage.', 'HARD'),
    (7, 1, 'Encryption', '/ɪnˈkrɪpʃn/', 'Process of converting data into code', 'Encryption ensures data security.', 'HARD'),
    (9, 2, 'Cuisine', '/kwɪˈziːn/', 'A style or method of cooking', 'I love Italian cuisine.', 'EASY'),
    (9, 2, 'Vegetarian', '/ˌvedʒəˈteriən/', 'A person who does not eat meat', 'Are there any vegetarian options?', 'EASY'),
    (1, 1, 'Deadline', '/ˈdedlaɪn/', 'A time by which something must be finished', 'We are working hard to meet the deadline.', 'MEDIUM'),
    (8, 1, 'Audit', '/ˈɔːdɪt/', 'An official inspection of an organization’s accounts', 'The company undergoes an annual audit.', 'HARD'),
    (5, 2, 'Present Perfect', '', 'Describes an action happened at an unspecified time', 'I have lived here for 10 years.', 'MEDIUM'),
    (4, 1, 'Inventory', '/ˈɪnvəntɔːri/', 'A complete list of items such as goods in stock', 'We need to check the inventory tonight.', 'MEDIUM'),
    (2, 1, 'Check-in', '/ˈtʃek ɪn/', 'The act of reporting one’s presence', 'Check-in starts at 2 PM.', 'EASY'),
    (10, 3, 'Custom Word', '', 'User personal word', 'This is my custom example.', 'EASY');

-- -------------------------------------------------------------
-- 5. FLASHCARD TRANSLATIONS (15 translations for 'vi')
-- -------------------------------------------------------------
INSERT INTO flashcard_translations (flashcard_id, locale, definition, example_sentence)
VALUES
    (1, 'vi', 'Cộng tác, hợp tác', 'Chúng ta cần hợp tác trong dự án này.'),
    (2, 'vi', 'Trì hoãn, hoãn lại', 'Cuộc họp đã bị hoãn đến thứ Sáu.'),
    (3, 'vi', 'Lịch trình chuyến đi', 'Vui lòng kiểm tra kỹ lịch trình du lịch của bạn.'),
    (4, 'vi', 'Đơn thuốc', 'Dược sĩ đã bốc thuốc theo đơn của tôi.'),
    (5, 'vi', 'Hoàn tiền', 'Tôi muốn yêu cầu hoàn tiền đầy đủ.'),
    (6, 'vi', 'Thế chấp', 'Họ đã nộp đơn vay thế chấp 30 năm.'),
    (7, 'vi', 'Mã hóa', 'Mã hóa đảm bảo an ninh dữ liệu.'),
    (8, 'vi', 'Ẩm thực', 'Tôi yêu ẩm thực Ý.'),
    (9, 'vi', 'Người ăn chay', 'Có lựa chọn nào cho người ăn chay không?'),
    (10, 'vi', 'Hạn chót', 'Chúng tôi đang làm việc chăm chỉ để kịp hạn chót.'),
    (11, 'vi', 'Kiểm toán', 'Công ty trải qua đợt kiểm toán hàng năm.'),
    (12, 'vi', 'Thì hiện tại hoàn thành', 'Mô tả hành động xảy ra tại thời điểm không xác định.'),
    (13, 'vi', 'Hàng tồn kho', 'Chúng ta cần kiểm tra hàng tồn kho tối nay.'),
    (14, 'vi', 'Thủ tục nhận phòng', 'Thủ tục nhận phòng bắt đầu lúc 2 giờ chiều.'),
    (15, 'vi', 'Từ tự định nghĩa', 'Đây là ví dụ cá nhân.');

-- -------------------------------------------------------------
-- 6. QUIZ OPTIONS (4 options for 10 cards)
-- -------------------------------------------------------------
INSERT INTO quiz_options (flashcard_id, option_text, is_correct)
VALUES
    (1, 'To work alone', FALSE), (1, 'To work together', TRUE), (1, 'To fight', FALSE), (1, 'To sleep', FALSE),
    (2, 'To cancel', FALSE), (2, 'To delay', TRUE), (2, 'To start', FALSE), (2, 'To finish', FALSE),
    (3, 'A map', FALSE), (3, 'A passport', FALSE), (3, 'A travel plan', TRUE), (3, 'A ticket', FALSE),
    (5, 'To pay more', FALSE), (5, 'To get money back', TRUE), (5, 'To lose money', FALSE), (5, 'To borrow', FALSE);

-- -------------------------------------------------------------
-- 7. USER PROGRESS (10 records - SM-2 logic)
-- -------------------------------------------------------------
INSERT INTO user_progress (user_id, flashcard_id, status, review_count, correct_count, easiness_factor, interval_days, next_review_at)
VALUES
    (3, 1, 'LEARNING', 1, 1, 2.50, 1, NOW() + INTERVAL '1 day'),
    (3, 2, 'MASTERED', 5, 5, 2.60, 30, NOW() + INTERVAL '30 days'),
    (4, 1, 'NEW', 0, 0, 2.50, 1, NOW()),
    (5, 3, 'REVIEWING', 3, 2, 2.10, 4, NOW() + INTERVAL '4 days'),
    (6, 4, 'LEARNING', 2, 1, 2.30, 2, NOW() + INTERVAL '2 days'),
    (7, 5, 'MASTERED', 10, 10, 2.80, 90, NOW() + INTERVAL '90 days'),
    (3, 3, 'LEARNING', 1, 0, 1.70, 1, NOW() + INTERVAL '1 day'),
    (8, 7, 'NEW', 0, 0, 2.50, 1, NOW()),
    (9, 8, 'MASTERED', 6, 6, 2.70, 45, NOW() + INTERVAL '45 days'),
    (10, 14, 'LEARNING', 1, 1, 2.50, 1, NOW() + INTERVAL '1 day');

-- -------------------------------------------------------------
-- 8. QUIZ ATTEMPTS (10 attempts)
-- -------------------------------------------------------------
INSERT INTO quiz_attempts (user_id, topic_id, quiz_type, total_questions, correct_answers, score, duration_seconds, finished_at)
VALUES
    (3, 1, 'MULTIPLE_CHOICE', 10, 8, 80, 120, NOW()),
    (3, 2, 'TRUE_FALSE', 5, 5, 100, 45, NOW()),
    (4, 1, 'MULTIPLE_CHOICE', 10, 4, 40, 200, NOW()),
    (5, 3, 'FILL_IN', 10, 7, 70, 300, NOW()),
    (6, 4, 'MULTIPLE_CHOICE', 5, 3, 60, 60, NOW()),
    (7, 1, 'MULTIPLE_CHOICE', 10, 10, 100, 90, NOW()),
    (8, 2, 'FILL_IN', 10, 2, 20, 150, NOW()),
    (3, 1, 'MULTIPLE_CHOICE', 10, 9, 90, 110, NOW()),
    (9, 8, 'MULTIPLE_CHOICE', 10, 8, 80, 140, NOW()),
    (10, 9, 'TRUE_FALSE', 5, 4, 80, 40, NOW());

-- -------------------------------------------------------------
-- 9. AUDIT LOGS (10 logs)
-- -------------------------------------------------------------
INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_value, new_value, ip_address)
VALUES
    (1, 'CREATE', 'TOPIC', 1, NULL, '{"name": "Office Life"}', '127.0.0.1'),
    (1, 'CREATE', 'FLASHCARD', 1, NULL, '{"word": "Collaborate"}', '127.0.0.1'),
    (1, 'UPDATE', 'USER', 3, '{"role": "USER"}', '{"role": "USER", "is_active": true}', '192.168.1.1'),
    (2, 'CREATE', 'TOPIC', 9, NULL, '{"name": "Eating Out"}', '10.0.0.5'),
    (1, 'DELETE', 'FLASHCARD', 99, '{"word": "Old Word"}', NULL, '127.0.0.1'),
    (3, 'UPDATE', 'TOPIC', 10, '{"name": "Private"}', '{"name": "My Personal Vocab"}', '172.16.0.1'),
    (1, 'CREATE', 'TOPIC', 2, NULL, '{"name": "Business Trip"}', '127.0.0.1'),
    (1, 'UPDATE', 'FLASHCARD', 2, '{"difficulty": "MEDIUM"}', '{"difficulty": "EASY"}', '127.0.0.1'),
    (2, 'CREATE', 'FLASHCARD', 8, NULL, '{"word": "Cuisine"}', '10.0.0.5'),
    (1, 'UPDATE', 'USER', 1, '{"is_active": true}', '{"is_active": true}', '127.0.0.1');

COMMIT;