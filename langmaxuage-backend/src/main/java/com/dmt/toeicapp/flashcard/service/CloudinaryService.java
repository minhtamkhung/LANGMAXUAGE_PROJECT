package com.dmt.toeicapp.flashcard.service;

import org.springframework.web.multipart.MultipartFile;

// Interface riêng theo nguyên tắc Interface Segregation (SOLID-I)
// FlashcardServiceImpl chỉ biết CloudinaryService, không biết implementation cụ thể
public interface CloudinaryService {

    // Upload ảnh — trả về record chứa secureUrl và publicId
    UploadResult upload(MultipartFile file);

    // Xóa ảnh theo publicId
    void delete(String publicId);

    // Record chứa kết quả upload — immutable, tự có getter
    record UploadResult(String secureUrl, String publicId) {}
}