package com.dmt.toeicapp.chatbot.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AiTopicRequest(
        @NotBlank(message = "Yêu cầu nhập nội dung mô tả chủ đề từ vựng.")
        @Size(min = 10, max = 200, message = "Yêu cầu mô tả chủ đề từ 10 đến 200 ký tự.")
        String prompt
) {}
