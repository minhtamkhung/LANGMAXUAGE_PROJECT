package com.dmt.toeicapp.chatbot.service;

import com.dmt.toeicapp.topic.dto.TopicResponse;

public interface AiTopicService {
    TopicResponse generateAndSaveTopic(String userRequest);
}