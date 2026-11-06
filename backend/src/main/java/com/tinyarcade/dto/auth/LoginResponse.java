package com.tinyarcade.dto.auth;

import com.tinyarcade.entity.user.User;
import com.tinyarcade.entity.user.UserRole;

/**
 * POST /api/auth/login 응답 {@code { accessToken, user: { id, email, nickname, role } }}.
 * 프론트는 accessToken을 localStorage에 저장하고, user로 GNB에 닉네임을 바로 보여 준다.
 * (record 안에 record를 넣어 JSON의 중첩 모양 user: {...}를 그대로 표현했다)
 */
public record LoginResponse(String accessToken, UserSummary user) {

    public record UserSummary(Long id, String email, String nickname, UserRole role) {
    }

    public static LoginResponse of(String accessToken, User user) {
        return new LoginResponse(accessToken,
                new UserSummary(user.getId(), user.getEmail(), user.getNickname(), user.getRole()));
    }
}
