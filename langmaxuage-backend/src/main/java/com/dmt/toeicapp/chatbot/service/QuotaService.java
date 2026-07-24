package com.dmt.toeicapp.chatbot.service;

public interface QuotaService {
    /**
     * Kiểm tra quota của user trong Redis.
     * Nếu đã dùng hết (>= 5 lần/ngày), throw AppException với mã lỗi HTTP 429.
     * Ngược lại, tăng counter lên 1.
     */
    void checkAndIncrementQuota(Long userId, String prompt);

    /**
     * Ghi nhận lượt tạo thành công vào database (ai_usage_logs).
     */
    void recordSuccess(Long userId, String prompt);

    /**
     * Hoàn trả lại 1 slot quota trong Redis (do lỗi sinh AI hoặc lỗi DB)
     * và ghi nhận logs FAILED vào database để phân tích.
     */
    void rollbackQuotaAndRecordFailure(Long userId, String prompt, String errorMsg);
}
