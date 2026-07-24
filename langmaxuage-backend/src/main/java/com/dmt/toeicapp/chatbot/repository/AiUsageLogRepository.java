package com.dmt.toeicapp.chatbot.repository;

import com.dmt.toeicapp.chatbot.entity.AiUsageLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiUsageLogRepository extends JpaRepository<AiUsageLog, Long> {
}
