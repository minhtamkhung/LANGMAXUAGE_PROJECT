package com.dmt.toeicapp.flashcard.service;

import com.dmt.toeicapp.flashcard.dto.FlashcardRequest;
import com.dmt.toeicapp.flashcard.dto.FlashcardResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

public interface FlashcardService {

    // locale: ngôn ngữ chính hiển thị ('en', 'vi', 'ja'...)
    // includeAllLocales: true → trả về Map<locale, content> cho toggle client-side
    Page<FlashcardResponse> getAccessible(String locale, boolean includeAllLocales, Pageable pageable);

    Page<FlashcardResponse> getByTopic(Long topicId, String locale, boolean includeAllLocales, Pageable pageable);

    FlashcardResponse getById(Long id, String locale, boolean includeAllLocales);

    FlashcardResponse create(FlashcardRequest request);

    FlashcardResponse update(Long id, FlashcardRequest request);

    void delete(Long id);

    FlashcardResponse uploadImage(Long id, MultipartFile file);

    FlashcardResponse deleteImage(Long id);
}