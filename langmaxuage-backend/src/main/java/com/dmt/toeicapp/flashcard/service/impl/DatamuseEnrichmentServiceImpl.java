package com.dmt.toeicapp.flashcard.service.impl;

   import com.dmt.toeicapp.external.datamuse.DatamuseClient;
   import com.dmt.toeicapp.external.datamuse.DatamuseResponse;
   import com.dmt.toeicapp.flashcard.entity.Flashcard;
   import com.dmt.toeicapp.flashcard.entity.FlashcardRelatedWord;
   import com.dmt.toeicapp.flashcard.repository.FlashcardRelatedWordRepository;
   import com.dmt.toeicapp.flashcard.repository.FlashcardRepository;
   import com.dmt.toeicapp.flashcard.service.DatamuseEnrichmentService;
   import lombok.RequiredArgsConstructor;
   import lombok.extern.slf4j.Slf4j;
   import org.springframework.scheduling.annotation.Async;
   import org.springframework.stereotype.Service;
   import org.springframework.transaction.annotation.Transactional;
   import reactor.core.publisher.Mono;

   import java.util.List;

   @Service
   @Slf4j
   @RequiredArgsConstructor
   public class DatamuseEnrichmentServiceImpl implements DatamuseEnrichmentService {

       private final DatamuseClient datamuseClient;
       private final FlashcardRepository flashcardRepository;
       private final FlashcardRelatedWordRepository relatedWordRepository;

       @Override
       @Async
       @Transactional
       public void enrichRelatedWordsAsync(Long flashcardId, String word) {
           log.info("Starting background related words enrichment for: '{}' (ID: {})", word, flashcardId);

           Mono.zip(
                   datamuseClient.fetchSynonyms(word),
                   datamuseClient.fetchRelatedWords(word)
           ).flatMap(tuple -> {
               List<DatamuseResponse> synonyms = tuple.getT1();
               List<DatamuseResponse> related = tuple.getT2();

               if (synonyms.isEmpty() && related.isEmpty()) {
                   log.info("No related words found on Datamuse for '{}'", word);
                   return Mono.empty();
               }

               return Mono.fromRunnable(() -> saveRelatedWords(flashcardId, synonyms, related));
           }).onErrorResume(throwable -> {
               log.error("Error during Datamuse enrichment for '{}' (ID: {}): {}", word, flashcardId, throwable.getMessage());
               return Mono.empty();
           }).block();
       }

       private void saveRelatedWords(Long flashcardId, List<DatamuseResponse> synonyms, List<DatamuseResponse> related) {
           Flashcard flashcard = flashcardRepository.findById(flashcardId).orElse(null);
           if (flashcard == null) {
               log.warn("Flashcard with ID {} not found. Aborting background enrichment.", flashcardId);
               return;
           }

           // Save synonyms
           for (DatamuseResponse res : synonyms) {
               FlashcardRelatedWord rw = FlashcardRelatedWord.builder()
                       .flashcard(flashcard)
                       .word(res.word())
                       .relationType(FlashcardRelatedWord.RelationType.SYNONYM)
                       .build();
               relatedWordRepository.save(rw);
           }

           // Save related words
           for (DatamuseResponse res : related) {
               FlashcardRelatedWord rw = FlashcardRelatedWord.builder()
                       .flashcard(flashcard)
                       .word(res.word())
                       .relationType(FlashcardRelatedWord.RelationType.RELATED)
                       .build();
               relatedWordRepository.save(rw);
           }

           log.info("Successfully saved related words for '{}' (ID: {}): {} synonyms, {} related words.",
                   flashcard.getWord(), flashcardId, synonyms.size(), related.size());
       }
   }
   
