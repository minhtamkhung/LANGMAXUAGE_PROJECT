package com.dmt.toeicapp.topic.mapper;

import com.dmt.toeicapp.topic.dto.TopicResponse;
import com.dmt.toeicapp.topic.entity.Topic;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface TopicMapper {

    @Mapping(source = "createdBy.id",       target = "createdById")
    @Mapping(source = "createdBy.username", target = "createdByUsername")
    @Mapping(source = "system",             target = "isSystem")
    @Mapping(target = "locale",                  ignore = true)
    @Mapping(target = "translatedName",          ignore = true)
    @Mapping(target = "translatedDescription",   ignore = true)
    TopicResponse toResponse(Topic topic);
}