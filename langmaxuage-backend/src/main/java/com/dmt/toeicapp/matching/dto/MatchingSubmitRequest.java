package com.dmt.toeicapp.matching.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record MatchingSubmitRequest(
        @NotNull(message = "sessionId không được để trống")
        Long sessionId,

        Integer durationSeconds,

        @NotNull(message = "Danh sách các cặp ghép không được để trống")
        @Valid
        List<MatchPair> pairs
) {
    public record MatchPair(
            @NotNull(message = "wordId không được để trống")
            Long wordId,

            @NotNull(message = "definitionId không được để trống")
            Long definitionId
    ) {}
}
