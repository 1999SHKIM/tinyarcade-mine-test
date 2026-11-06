package com.tinyarcade.dto.auth;

import com.tinyarcade.entity.user.User;

/** POST /api/auth/signup 응답 (201) */
public record SignupResponse(Long id, String email, String nickname) {

    public static SignupResponse from(User user) {
        return new SignupResponse(user.getId(), user.getEmail(), user.getNickname());
    }
}
