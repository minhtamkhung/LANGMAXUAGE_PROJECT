package com.dmt.toeicapp.user.mapper;

import com.dmt.toeicapp.user.dto.UserResponse;
import com.dmt.toeicapp.user.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(source = "role", target = "role",
            defaultExpression = "java(source.getRole().name())")
    UserResponse toResponse(User source);
}