package com.dmt.toeicapp.topic.service;

import com.dmt.toeicapp.topic.dto.TopicRequest;
import com.dmt.toeicapp.topic.dto.TopicResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface TopicService {

    // locale: ngôn ngữ chính — trả về translatedName nếu có, fallback về name gốc
    List<TopicResponse> getAccessible(String locale);

    Page<TopicResponse> search(String query, String filter, String locale, Pageable pageable);

    TopicResponse getById(Long id, String locale);

    TopicResponse create(TopicRequest request);

    TopicResponse update(Long id, TopicRequest request);

    void delete(Long id);
}