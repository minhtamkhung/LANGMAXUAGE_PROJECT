package com.dmt.toeicapp.matching.repository;

import com.dmt.toeicapp.matching.entity.MatchingSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MatchingSessionRepository extends JpaRepository<MatchingSession, Long> {

    /**
     * Tìm phiên matching theo id và userId (bảo vệ quyền truy cập tài nguyên).
     */
    Optional<MatchingSession> findByIdAndUserId(Long id, Long userId);
}
