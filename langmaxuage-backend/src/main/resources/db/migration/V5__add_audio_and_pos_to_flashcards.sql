-- V5__add_audio_and_pos_to_flashcards.sql
ALTER TABLE flashcards
    ADD COLUMN audio_url      VARCHAR(500),
    ADD COLUMN part_of_speech VARCHAR(50);
