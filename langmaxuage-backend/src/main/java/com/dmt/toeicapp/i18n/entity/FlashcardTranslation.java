package com.dmt.toeicapp.i18n.entity;

import com.dmt.toeicapp.flashcard.entity.Flashcard;
import com.dmt.toeicapp.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "flashcard_translations",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_flashcard_locale",
                columnNames = { "flashcard_id", "locale" }
        ))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FlashcardTranslation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "flashcard_id", nullable = false)
    private Flashcard flashcard;

    // Lưu locale code trực tiếp (string), không join sang SupportedLocale
    // để tránh thêm join không cần thiết khi query
    @Column(name = "locale", nullable = false, length = 10)
    private String locale;          // 'vi', 'en', 'ja'

    @Column(name = "definition", nullable = false, columnDefinition = "TEXT")
    private String definition;

    @Column(name = "example_sentence", columnDefinition = "TEXT")
    private String exampleSentence;

    // Ai tạo bản dịch này (user hoặc admin)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}