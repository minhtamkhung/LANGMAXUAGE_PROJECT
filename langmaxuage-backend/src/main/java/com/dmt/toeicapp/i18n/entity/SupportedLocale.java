package com.dmt.toeicapp.i18n.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "supported_locales")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupportedLocale {

    @Id
    @Column(name = "code", length = 10)
    private String code;           // 'vi', 'en', 'ja', 'ko'

    @Column(name = "name", nullable = false, length = 50)
    private String name;           // 'Vietnamese'

    @Column(name = "native_name", nullable = false, length = 50)
    private String nativeName;     // 'Tiếng Việt'

    @Column(name = "is_default", nullable = false)
    @Builder.Default
    private boolean defaultLocale  = false;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private int displayOrder = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}