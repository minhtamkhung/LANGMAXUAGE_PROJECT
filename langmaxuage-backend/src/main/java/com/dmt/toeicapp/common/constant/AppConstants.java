package com.dmt.toeicapp.common.constant;

/**
 * Các hằng số dùng chung toàn ứng dụng.
 * Tập trung ở đây để tránh magic string rải rác nhiều nơi.
 */
public final class AppConstants {

    private AppConstants() {} // prevent instantiation

    // ── Locale ───────────────────────────────────────────────────
    /** Ngôn ngữ mặc định — dùng cho entity gốc và fallback khi không có bản dịch */
    public static final String DEFAULT_LOCALE = "en";

    /** Các locale được hỗ trợ (thêm vào đây khi mở rộng) */
    public static final java.util.Set<String> SUPPORTED_LOCALES =
            java.util.Set.of("en", "vi", "ja", "ko");
}
