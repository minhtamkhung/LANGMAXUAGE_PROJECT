package com.dmt.toeicapp.topic.service;

import com.dmt.toeicapp.topic.dto.TopicRequest;
import com.dmt.toeicapp.topic.dto.TopicResponse;

import java.util.List;

public interface TopicService {

    // locale: ngôn ngữ chính — trả về translatedName nếu có, fallback về name gốc
    List<TopicResponse> getAccessible(String locale);

    TopicResponse getById(Long id, String locale);

    TopicResponse create(TopicRequest request);

    TopicResponse update(Long id, TopicRequest request);

    void delete(Long id);
}