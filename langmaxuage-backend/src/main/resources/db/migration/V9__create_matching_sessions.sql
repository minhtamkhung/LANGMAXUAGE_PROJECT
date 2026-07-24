-- V9: Tạo bảng lưu phiên trò chơi nối từ (Matching Game)
-- Mỗi phiên lưu kết quả tổng quan về số cặp đúng/sai và thời gian hoàn thành.

CREATE TABLE matching_sessions (
    id               BIGSERIAL      PRIMARY KEY,
    user_id          BIGINT         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_id         BIGINT         REFERENCES topics(id) ON DELETE SET NULL,
    total_pairs      INT            NOT NULL DEFAULT 0,
    correct_pairs    INT            NOT NULL DEFAULT 0,
    accuracy         NUMERIC(5, 2)  NOT NULL DEFAULT 0.00,
    duration_seconds INT,
    started_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    finished_at      TIMESTAMPTZ
);

CREATE INDEX idx_matching_sessions_user_id ON matching_sessions(user_id);
