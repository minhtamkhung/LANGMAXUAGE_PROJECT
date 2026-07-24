package com.dmt .toeicapp.flashcard.entity;

import com.dmt.toeicapp.topic.entity.Topic;
import com.dmt.toeicapp.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "flashcards")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Flashcard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "topic_id", nullable = false)
    private Topic topic;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Column(nullable = false, length = 200)
    private String word;

    @Column(length = 200)
    private String pronunciation;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String definition;

    @Column(name = "example_sentence", columnDefinition = "TEXT")
    private String exampleSentence;

    @Column(name = "image_url", length = 500)
    private String imageUrl;           // Cloudinary secure_url

    @Column(name = "image_public_id", length = 200)
    private String imagePublicId;      // Cloudinary public_id — dùng để xóa ảnh

    @Column(name = "audio_url", length = 500)
    private String audioUrl;

    @Column(name = "part_of_speech", length = 50)
    private String partOfSpeech;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    @Builder.Default
    private Difficulty difficulty = Difficulty.MEDIUM;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "flashcard", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<FlashcardRelatedWord> relatedWords = new ArrayList<>();

    public enum Difficulty {
        EASY, MEDIUM, HARD
    }
}