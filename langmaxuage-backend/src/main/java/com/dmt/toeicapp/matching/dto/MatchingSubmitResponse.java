package com.dmt.toeicapp.matching.dto;

import java.math.BigDecimal;

public record MatchingSubmitResponse(
        Long sessionId,
        String topicName,
        int totalPairs,
        int correctPairs,
        BigDecimal accuracy,
        Integer durationSeconds
) {}
