package com.dmt.toeicapp.external.dictionary;

public record WordEnrichmentResult(
        String pronunciation,
        String audioUrl,
        String partOfSpeech
) {}
