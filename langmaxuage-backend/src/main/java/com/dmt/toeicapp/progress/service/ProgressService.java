package com.dmt.toeicapp.progress.service;

import com.dmt.toeicapp.progress.dto.ProgressResponse;
import com.dmt.toeicapp.progress.dto.ReviewRequest;
import java.util.List;

public interface ProgressService {
    List<ProgressResponse> getMyProgress(String locale);
    List<ProgressResponse> getDueCards(String locale);
    ProgressResponse review(ReviewRequest request, String locale);
}