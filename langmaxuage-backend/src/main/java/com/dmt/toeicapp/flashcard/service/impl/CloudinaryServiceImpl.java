package com.dmt.toeicapp.flashcard.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.dmt.toeicapp.common.exception.AppException;
import com.dmt.toeicapp.flashcard.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class CloudinaryServiceImpl implements CloudinaryService {

    private final Cloudinary cloudinary;

    @Value("${app.cloudinary.folder}")
    private String folder;

    @Override
    public UploadResult upload(MultipartFile file) {
        validateFile(file);
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> result = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder",          folder,
                            "resource_type",   "image",
                            "transformation",  "q_auto,f_auto"  // tự optimize chất lượng + format
                    )
            );
            String secureUrl = (String) result.get("secure_url");
            String publicId  = (String) result.get("public_id");
            log.info("Cloudinary upload thành công: {}", publicId);
            return new UploadResult(secureUrl, publicId);

        } catch (IOException e) {
            log.error("Cloudinary upload thất bại", e);
            throw AppException.badRequest("Upload ảnh thất bại, vui lòng thử lại", "IMAGE_UPLOAD_FAILED");
        }
    }

    @Override
    public void delete(String publicId) {
        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            log.info("Cloudinary xóa ảnh thành công: {}", publicId);
        } catch (IOException e) {
            // Log lỗi nhưng không throw — xóa ảnh cũ thất bại không nên block flow chính
            log.warn("Cloudinary xóa ảnh thất bại: {}", publicId, e);
        }
    }

    // ── Private helpers ───────────────────────────────────────

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw AppException.badRequest("File ảnh không được để trống", "IMAGE_EMPTY");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw AppException.badRequest("Chỉ chấp nhận file ảnh (jpg, png, webp...)", "IMAGE_INVALID_TYPE");
        }

        long maxSize = 5 * 1024 * 1024; // 5MB
        if (file.getSize() > maxSize) {
            throw AppException.badRequest("Ảnh không được vượt quá 5MB", "IMAGE_TOO_LARGE");
        }
    }
}