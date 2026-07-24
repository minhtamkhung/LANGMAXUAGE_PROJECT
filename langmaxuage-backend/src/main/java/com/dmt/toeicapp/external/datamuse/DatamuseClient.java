package com.dmt.toeicapp.external.datamuse;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.List;

@Component
@Slf4j
@RequiredArgsConstructor
public class DatamuseClient {

    private final WebClient webClient;

    public Mono<List<DatamuseResponse>> fetchSynonyms(String word) {
        return fetchFromDatamuse(word, "rel_syn");
    }

    public Mono<List<DatamuseResponse>> fetchRelatedWords(String word) {
        return fetchFromDatamuse(word, "rel_trg");
    }

    private Mono<List<DatamuseResponse>> fetchFromDatamuse(String word, String paramName) {
        String url = "https://api.datamuse.com/words?" + paramName + "=" + word + "&max=5";

        return webClient.get()
                .uri(url)
                .retrieve()
                .bodyToFlux(DatamuseResponse.class)
                .collectList()
                .timeout(Duration.ofSeconds(5))
                .onErrorResume(throwable -> {
                    log.warn("Failed to fetch Datamuse data ({}) for '{}': {}", paramName, word, throwable.getMessage());
                    return Mono.just(List.of());
                });
    }
}
