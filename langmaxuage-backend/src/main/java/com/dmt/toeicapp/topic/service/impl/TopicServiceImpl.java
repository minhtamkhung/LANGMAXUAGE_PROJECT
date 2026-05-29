package com.dmt.toeicapp.topic.service.impl;

import com.dmt.toeicapp.common.exception.AppException;
import com.dmt.toeicapp.common.security.SecurityUtils;
import com.dmt.toeicapp.i18n.entity.TopicTranslation;
import com.dmt.toeicapp.i18n.repository.TopicTranslationRepository;
import com.dmt.toeicapp.topic.dto.TopicRequest;
import com.dmt.toeicapp.topic.dto.TopicResponse;
import com.dmt.toeicapp.topic.entity.Topic;
import com.dmt.toeicapp.topic.mapper.TopicMapper;
import com.dmt.toeicapp.topic.repository.TopicRepository;
import com.dmt.toeicapp.topic.service.TopicService;
import com.dmt.toeicapp.user.entity.User;
import com.dmt.toeicapp.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TopicServiceImpl implements TopicService {

    private final TopicRepository            topicRepository;
    private final UserRepository             userRepository;
    private final TopicMapper                topicMapper;
    private final TopicTranslationRepository translationRepository;

    private static final String DEFAULT_LOCALE = "en";

    @Override
    @Transactional(readOnly = true)
    public List<TopicResponse> getAccessible(String locale) {
        Long       currentUserId = SecurityUtils.getCurrentUserId();
        List<Topic> topics       = topicRepository.findAccessibleByUser(currentUserId);

        if (isDefaultLocale(locale)) {
            return topics.stream().map(topicMapper::toResponse).toList();
        }

        // Batch load translations — 1 query
        List<Long> topicIds = topics.stream().map(Topic::getId).toList();
        Map<Long, TopicTranslation> transMap = translationRepository
                .findByTopicIdsAndLocale(topicIds, locale)
                .stream()
                .collect(Collectors.toMap(t -> t.getTopic().getId(), t -> t));

        return topics.stream()
                .map(topic -> applyTranslation(
                        topicMapper.toResponse(topic),
                        transMap.get(topic.getId()),
                        locale))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public TopicResponse getById(Long id, String locale) {
        Topic topic = findAndCheckAccess(id);
        TopicResponse base = topicMapper.toResponse(topic);

        if (isDefaultLocale(locale)) return base;

        TopicTranslation trans = translationRepository
                .findByTopicIdAndLocale(id, locale)
                .orElse(null);

        return applyTranslation(base, trans, locale);
    }

    @Override
    @Transactional
    public TopicResponse create(TopicRequest request) {
        Long    currentUserId = SecurityUtils.getCurrentUserId();
        boolean isAdmin       = SecurityUtils.isAdmin();

        if (!isAdmin && topicRepository.existsByNameAndCreatedById(request.name(), currentUserId)) {
            throw AppException.conflict(
                    "Bạn đã có topic tên '" + request.name() + "' rồi",
                    "TOPIC_NAME_DUPLICATE");
        }

        User owner = userRepository.getReferenceById(currentUserId);
        Topic topic = Topic.builder()
                .name(request.name())
                .description(request.description())
                .iconUrl(request.iconUrl())
                .system(isAdmin)
                .createdBy(owner)
                .build();

        return topicMapper.toResponse(topicRepository.save(topic));
    }

    @Override
    @Transactional
    public TopicResponse update(Long id, TopicRequest request) {
        Topic topic = findAndCheckOwnership(id);
        topic.setName(request.name());
        topic.setDescription(request.description());
        topic.setIconUrl(request.iconUrl());
        return topicMapper.toResponse(topicRepository.save(topic));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        topicRepository.delete(findAndCheckOwnership(id));
    }

    // ── Private helpers ───────────────────────────────────────

    private TopicResponse applyTranslation(TopicResponse base,
                                           TopicTranslation trans,
                                           String locale) {
        if (trans == null) return base;   // không có bản dịch → trả nguyên bản tiếng Anh

        return new TopicResponse(
                base.id(),
                base.name(),           // tên gốc tiếng Anh — luôn giữ
                base.description(),
                locale,
                trans.getName(),          // tên dịch
                trans.getDescription(),   // mô tả dịch
                base.iconUrl(),
                base.displayOrder(),
                base.isSystem(),
                base.createdById(),
                base.createdByUsername(),
                base.createdAt()
        );
    }

    private boolean isDefaultLocale(String locale) {
        return locale == null || DEFAULT_LOCALE.equalsIgnoreCase(locale);
    }

    private Topic findAndCheckAccess(Long id) {
        Long  currentUserId = SecurityUtils.getCurrentUserId();
        Topic topic = topicRepository.findById(id)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy topic với id = " + id));

        if (!topic.isSystem() && !topic.getCreatedBy().getId().equals(currentUserId)) {
            throw AppException.forbidden("Bạn không có quyền truy cập topic này");
        }
        return topic;
    }

    private Topic findAndCheckOwnership(Long id) {
        Long    currentUserId = SecurityUtils.getCurrentUserId();
        boolean isAdmin       = SecurityUtils.isAdmin();
        Topic topic = topicRepository.findById(id)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy topic với id = " + id));

        if (!isAdmin && !topic.getCreatedBy().getId().equals(currentUserId)) {
            throw AppException.forbidden("Bạn không có quyền chỉnh sửa topic này");
        }
        return topic;
    }
}