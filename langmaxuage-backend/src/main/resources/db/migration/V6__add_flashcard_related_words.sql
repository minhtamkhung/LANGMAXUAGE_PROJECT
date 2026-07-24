-- V6__add_flashcard_related_words.sql
CREATE TABLE flashcard_related_words (
    id             BIGSERIAL PRIMARY KEY,
    flashcard_id   BIGINT       NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
    word           VARCHAR(200) NOT NULL,
    relation_type  VARCHAR(20)  NOT NULL,  -- SYNONYM | RELATED
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_related_words_flashcard ON flashcard_related_words(flashcard_id);
