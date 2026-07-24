package com.dmt.toeicapp.matching.service;

import com.dmt.toeicapp.matching.dto.*;

public interface MatchingService {

    /**
     * Bắt đầu một phiên chơi Matching.
     * Chọn ngẫu nhiên N cặp từ trong topic, tạo session và trả về dữ liệu đã xáo trộn.
     */
    MatchingStartResponse start(MatchingStartRequest request, String locale);

    /**
     * Nộp kết quả Matching.
     * Tính toán số cặp ghép đúng, tỉ lệ chính xác và lưu vào database.
     */
    MatchingSubmitResponse submit(MatchingSubmitRequest request, String locale);
}
