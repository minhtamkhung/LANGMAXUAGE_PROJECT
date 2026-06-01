package com.dmt.toeicapp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.data.redis.repository.configuration.EnableRedisRepositories;
import org.springframework.data.web.config.EnableSpringDataWebSupport;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
@EnableSpringDataWebSupport(pageSerializationMode = EnableSpringDataWebSupport.PageSerializationMode.VIA_DTO)
// Chỉ định rõ Spring Data JPA quản lý tất cả repositories trong base package.
// Điều này ngăn Spring Data Redis "tranh" scan các JpaRepository.
@EnableJpaRepositories(basePackages = "com.dmt.toeicapp")
// Disable hoàn toàn Redis Repository scanning.
// Project chỉ dùng Redis qua StringRedisTemplate (lưu refresh token),
// không có @RedisHash entity nào cần Redis Repository.
@EnableRedisRepositories(basePackages = {})
public class ToeicApplication {
    public static void main(String[] args) {
        SpringApplication.run(ToeicApplication.class, args);
    }
}
