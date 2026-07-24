package com.dmt.toeicapp.matching.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record MatchingStartRequest(
        @NotNull(message = "topicId không được để trống")
        Long topicId,

        @NotNull(message = "pairCount không được để trống")
        @Min(value = 4, message = "Số lượng cặp tối thiểu là 4")
        @Max(value = 12, message = "Số lượng cặp tối đa là 12")
        Integer pairCount
) {}
