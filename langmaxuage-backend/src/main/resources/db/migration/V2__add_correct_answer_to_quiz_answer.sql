-- Bước 1: thêm column, cho phép NULL trước để backfill
ALTER TABLE quiz_answers
    ADD COLUMN correct_answer TEXT;

-- Bước 2: backfill data cũ bằng definition EN của flashcard
-- (quiz cũ không có locale nên dùng EN làm fallback, tạm chấp nhận)
UPDATE quiz_answers qa
SET correct_answer = (
    SELECT f.definition
    FROM flashcards f
    WHERE f.id = qa.flashcard_id
)
WHERE correct_answer IS NULL;

-- Bước 3: đặt NOT NULL sau khi đã backfill xong
ALTER TABLE quiz_answers
    ALTER COLUMN correct_answer SET NOT NULL;