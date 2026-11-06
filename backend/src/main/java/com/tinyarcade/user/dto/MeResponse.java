package com.tinyarcade.user.dto;

import com.tinyarcade.user.User;
import com.tinyarcade.user.UserRole;
import com.tinyarcade.user.UserStatus;
import java.time.OffsetDateTime;

/** GET /api/users/me 응답 (03_10_tinyarcade_auth §3) */
public record MeResponse(
        Long id,
        String email,
        String nickname,
        UserRole role,
        UserStatus status,
        OffsetDateTime createdAt
) {
    public static MeResponse from(User user) {
        return new MeResponse(user.getId(), user.getEmail(), user.getNickname(),
                user.getRole(), user.getStatus(), user.getCreatedAt());
    }
}
