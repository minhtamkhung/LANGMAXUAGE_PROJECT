CREATE TABLE ai_usage_logs (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    prompt      VARCHAR(500)  NOT NULL,
    status      VARCHAR(50)   NOT NULL, -- SUCCESS, FAILED
    error_msg   TEXT,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_usage_logs_user_date ON ai_usage_logs(user_id, created_at);
