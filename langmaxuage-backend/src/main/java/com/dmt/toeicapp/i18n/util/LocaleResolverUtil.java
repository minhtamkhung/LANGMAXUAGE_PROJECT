package com.dmt.toeicapp.i18n.util;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Utility để lấy locale từ request header.
 *
 * Frontend gửi: Accept-Language: vi
 * Backend đọc và fallback về 'en' nếu không có.
 *
 * Cách dùng trong Service:
 *   String locale = LocaleResolverUtil.resolveLocale();
 *   Optional<FlashcardTranslation> trans = translationRepo
 *       .findByFlashcardIdAndLocale(id, locale);
 *   // Nếu không có bản dịch → dùng flashcard.definition gốc (tiếng Anh)
 */
public final class LocaleResolverUtil {

    private static final String DEFAULT_LOCALE = "en";
    private static final String HEADER_NAME    = "Accept-Language";

    private LocaleResolverUtil() {}

    /**
     * Lấy locale từ header của request hiện tại.
     * Fallback về 'en' nếu header không có hoặc rỗng.
     *
     * Chỉ lấy phần đầu tiên — 'vi-VN,vi;q=0.9' → 'vi'
     */
    public static String resolveLocale() {
        try {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs == null) return DEFAULT_LOCALE;

            HttpServletRequest request = attrs.getRequest();
            String header = request.getHeader(HEADER_NAME);

            if (header == null || header.isBlank()) return DEFAULT_LOCALE;

            // Lấy phần đầu, bỏ region code: 'vi-VN' → 'vi'
            return header.split("[,;-]")[0].trim().toLowerCase();

        } catch (Exception e) {
            return DEFAULT_LOCALE;
        }
    }

    /**
     * Resolve với fallback tùy chỉnh
     */
    public static String resolveLocale(String fallback) {
        String locale = resolveLocale();
        return locale.equals(DEFAULT_LOCALE) ? fallback : locale;
    }
}