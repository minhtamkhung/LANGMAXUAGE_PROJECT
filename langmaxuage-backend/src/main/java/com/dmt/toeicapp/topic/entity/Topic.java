package com.dmt.toeicapp.topic.entity;

import com.dmt.toeicapp.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "topics")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Topic {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "icon_url", length = 500)
    private String iconUrl;

    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private int displayOrder = 0;

    // QUAN TRỌNG: Đặt tên field là "system" thay vì "isSystem"
    // Nếu đặt "isSystem": Lombok tạo getter isSystem() → Hibernate hiểu property "system" → map sai cột
    // Đặt "system": Lombok tạo getter getSystem() → Hibernate hiểu property "system" → map đúng cột is_system
    @Column(name = "is_system", nullable = false)
    @Builder.Default
    private boolean system = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}