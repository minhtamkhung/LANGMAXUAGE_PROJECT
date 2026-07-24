package com.dmt.toeicapp.typing.repository;

import com.dmt.toeicapp.typing.entity.TypingSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TypingSessionRepository extends JpaRepository<TypingSession, Long> {

    /**
     * Tìm phiên theo id VÀ user_id — đảm bảo user chỉ submit phiên của chính mình.
     */
    Optional<TypingSession> findByIdAndUserId(Long id, Long userId);
}
