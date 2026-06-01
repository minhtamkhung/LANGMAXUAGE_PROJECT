package com.dmt.toeicapp.flashcard.dto;

import java.util.List;

/**
 * Kết quả bulk import CSV — trả về số lượng thành công/thất bại và danh sách lỗi.
 */
public record BulkImportResult(
        int successCount,
        int failCount,
        List<String> errors
) {}
