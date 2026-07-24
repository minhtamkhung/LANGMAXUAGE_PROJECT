-- =============================================================
-- V10__add_performance_indexes.sql
-- Optimizing queries for Flashcards, Topics, Progress, and Sessions
-- =============================================================

-- 1. Composite Index cho Query lấy Flashcards theo Topic + Active + Order
CREATE INDEX IF NOT EXISTS idx_flashcards_topic_active_created
    ON flashcards(topic_id, is_active, created_at DESC);

-- 2. Functional Index cho kiểm tra trùng từ (LOWER) trong Topic
CREATE INDEX IF NOT EXISTS idx_flashcards_topic_word_lower
    ON flashcards(topic_id, is_active, LOWER(word));

-- 3. Functional Index cho kiểm tra trùng tên Topic của User (LOWER)
CREATE INDEX IF NOT EXISTS idx_topics_user_name_lower
    ON topics(created_by, LOWER(name));

-- 4. Composite Index cho Session Verification (Typing & Matching)
CREATE INDEX IF NOT EXISTS idx_typing_sessions_id_user
    ON typing_sessions(id, user_id);

CREATE INDEX IF NOT EXISTS idx_matching_sessions_id_user
    ON matching_sessions(id, user_id);

-- 5. Composite Index cho Spaced Repetition Due Reviews
CREATE INDEX IF NOT EXISTS idx_progress_due_reviews
    ON user_progress(user_id, status, next_review_at);

