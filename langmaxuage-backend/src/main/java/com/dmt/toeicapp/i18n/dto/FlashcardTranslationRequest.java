package com.dmt.toeicapp.i18n.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record FlashcardTranslationRequest(
        @NotBlank(message = "Locale không được để trống")
        String locale,

        @NotBlank(message = "Definition không được để trống")
        @Size(min = 2, message = "Definition ít nhất 2 ký tự")
        String definition,

        String exampleSentence
) {}