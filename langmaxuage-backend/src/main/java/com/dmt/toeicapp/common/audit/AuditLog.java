package com.dmt.toeicapp.common.audit;

import com.dmt.toeicapp.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")   // nullable — system action không có user
    private User user;

    @Column(nullable = false, length = 20)
    private String action;          // 'CREATE', 'UPDATE', 'DELETE'

    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;      // 'FLASHCARD', 'TOPIC', 'USER'

    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    @Column(name = "old_value", columnDefinition = "TEXT")
    private String oldValue;        // JSON snapshot trước thay đổi

    @Column(name = "new_value", columnDefinition = "TEXT")
    private String newValue;        // JSON snapshot sau thay đổi

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}