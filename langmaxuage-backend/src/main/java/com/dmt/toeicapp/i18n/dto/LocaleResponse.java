package com.dmt.toeicapp.i18n.dto;

public record LocaleResponse(
        String  code,
        String  name,
        String  nativeName,
        boolean defaultLocale,
        boolean active,
        int     displayOrder
) {}