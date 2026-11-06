package com.tinyarcade.auth.dto;

import com.tinyarcade.user.User;
import com.tinyarcade.user.UserRole;

/** POST /api/auth/login 응답 { accessToken, user: { id, email, nickname, role } } */
public record LoginResponse(String accessToken, UserSummary user) {

    public record UserSummary(Long id, String email, String nickname, UserRole role) {
    }

    public static LoginResponse of(String accessToken, User user) {
        return new LoginResponse(accessToken,
                new UserSummary(user.getId(), user.getEmail(), user.getNickname(), user.getRole()));
    }
}
