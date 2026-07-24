package com.dmt.toeicapp.external.dictionary;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;

@Component
@Slf4j
@RequiredArgsConstructor
public class DictionaryClient {

    private final WebClient webClient;

    public Mono<WordEnrichmentResult> enrichWord(String word) {
        String url = "https://api.dictionaryapi.dev/api/v2/entries/en/" + word;

        return webClient.get()
                .uri(url)
                .retrieve()
                .bodyToMono(DictionaryResponse[].class)
                .timeout(Duration.ofSeconds(5))
                .map(this::extractEnrichment)
                .onErrorResume(throwable -> {
                    log.warn("Failed to enrich word '{}' from Dictionary API: {}", word, throwable.getMessage());
                    return Mono.just(new WordEnrichmentResult(null, null, null));
                });
    }

    private WordEnrichmentResult extractEnrichment(DictionaryResponse[] responses) {
        if (responses == null || responses.length == 0) {
            return new WordEnrichmentResult(null, null, null);
        }

        DictionaryResponse first = responses[0];

        // 1. Pronunciation
        String pronunciation = first.phonetic();
        if (pronunciation == null && first.phonetics() != null) {
            pronunciation = first.phonetics().stream()
                    .map(DictionaryResponse.Phonetic::text)
                    .filter(t -> t != null && !t.isBlank())
                    .findFirst()
                    .orElse(null);
        }

        // 2. Audio URL
        String audioUrl = null;
        if (first.phonetics() != null) {
            audioUrl = first.phonetics().stream()
                    .map(DictionaryResponse.Phonetic::audio)
                    .filter(a -> a != null && !a.isBlank())
                    .findFirst()
                    .orElse(null);
        }

        // 3. Part Of Speech
        String partOfSpeech = null;
        if (first.meanings() != null && !first.meanings().isEmpty()) {
            partOfSpeech = first.meanings().get(0).partOfSpeech();
        }

        return new WordEnrichmentResult(pronunciation, audioUrl, partOfSpeech);
    }
}
