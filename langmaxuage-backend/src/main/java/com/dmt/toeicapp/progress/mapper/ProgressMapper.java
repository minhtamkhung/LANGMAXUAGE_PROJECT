package com.dmt.toeicapp.progress.mapper;

import com.dmt.toeicapp.flashcard.mapper.FlashcardMapper;
import com.dmt.toeicapp.progress.dto.ProgressResponse;
import com.dmt.toeicapp.progress.entity.UserProgress;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = {FlashcardMapper.class})
public interface ProgressMapper {

    @Mapping(source = "flashcard", target = "flashcard") // Sử dụng FlashcardMapper để map lồng
    @Mapping(source = "status",    target = "status", defaultExpression = "java(source.getStatus().name())")
    ProgressResponse toResponse(UserProgress source);
}