package com.dmt.toeicapp.progress.service;

import com.dmt.toeicapp.progress.dto.ProgressResponse;
import com.dmt.toeicapp.progress.dto.ReviewRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ProgressService {
    /** Lấy toàn bộ progress của user có phân trang — dùng cho trang chủ/thống kê */
    Page<ProgressResponse> getMyProgress(String locale, Pageable pageable);

    /** Lấy danh sách card đến hạn ôn hôm nay (tự nhiên giới hạn theo thời gian) */
    List<ProgressResponse> getDueCards(String locale);

    ProgressResponse review(ReviewRequest request, String locale);
}