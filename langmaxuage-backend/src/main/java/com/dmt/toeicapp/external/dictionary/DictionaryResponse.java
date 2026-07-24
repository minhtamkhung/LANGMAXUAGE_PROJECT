package com.dmt.toeicapp.external.dictionary;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record DictionaryResponse(
        String word,
        String phonetic,
        List<Phonetic> phonetics,
        List<Meaning> meanings
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Phonetic(
            String text,
            String audio
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Meaning(
            String partOfSpeech
    ) {}
}
