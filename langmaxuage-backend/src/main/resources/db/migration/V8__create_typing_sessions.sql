-- V8: Tạo bảng lưu phiên luyện gõ chính tả (Typing Practice)
-- Mỗi phiên tương ứng với một lần người dùng chọn topic và gõ N từ.
-- Không cần bảng chi tiết từng câu trả lời vì kết quả được submit một lần cuối buổi.

CREATE TABLE typing_sessions (
    id               BIGSERIAL      PRIMARY KEY,
    user_id          BIGINT         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_id         BIGINT         REFERENCES topics(id) ON DELETE SET NULL,
    total_cards      INT            NOT NULL DEFAULT 0,
    correct_count    INT            NOT NULL DEFAULT 0,
    accuracy         NUMERIC(5, 2)  NOT NULL DEFAULT 0.00,
    duration_seconds INT,
    started_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    finished_at      TIMESTAMPTZ
);

CREATE INDEX idx_typing_sessions_user_id ON typing_sessions(user_id);
