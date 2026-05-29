package com.dmt.toeicapp.i18n.repository;

import com.dmt.toeicapp.i18n.entity.SupportedLocale;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SupportedLocaleRepository extends JpaRepository<SupportedLocale, String> {

    // Lấy tất cả locale đang active — dùng cho dropdown chọn ngôn ngữ
    List<SupportedLocale> findByActiveTrueOrderByDisplayOrderAsc();

    // Lấy locale mặc định — fallback khi user chưa chọn ngôn ngữ
    Optional<SupportedLocale> findByDefaultLocaleTrue();
}