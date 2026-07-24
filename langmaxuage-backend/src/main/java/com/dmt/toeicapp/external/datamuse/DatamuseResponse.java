package com.dmt.toeicapp.external.datamuse;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record DatamuseResponse(
        String word,
        int score
) {}
