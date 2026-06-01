package com.dmt.toeicapp.chatbot.dto;

import jakarta.validation.constraints.NotBlank;

public record AiTopicRequest(
        @NotBlank(message = "Yêu cầu nhập nội dung mô tả chủ đề từ vựng.")
        String prompt
) {}
