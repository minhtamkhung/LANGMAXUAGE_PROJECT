package com.dmt.toeicapp.common.aop;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Đánh dấu method cần ghi audit log.
 * AuditAspect (Phase 2) sẽ tự động ghi vào bảng audit_logs khi method được gọi.
 *
 * Cách dùng:
 * {@code @Auditable(action = "DELETE", entity = "FLASHCARD")}
 * {@code public void delete(Long id) { ... }}
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Auditable {

    // Hành động: CREATE, UPDATE, DELETE
    String action();

    // Tên entity bị tác động: FLASHCARD, TOPIC, USER
    String entity();
}