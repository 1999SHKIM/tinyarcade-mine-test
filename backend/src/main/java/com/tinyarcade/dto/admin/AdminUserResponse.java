package com.tinyarcade.dto.admin;

import com.tinyarcade.entity.user.User;
import com.tinyarcade.entity.user.UserRole;
import com.tinyarcade.entity.user.UserStatus;
import java.time.OffsetDateTime;

/**
 * 어드민 유저 목록·상태 응답 DTO (24번 유저 관리, 허 담당).
 */
public record AdminUserResponse(
        Long id,
        String email,
        String nickname,
        UserRole role,
        UserStatus status,
        OffsetDateTime createdAt,
        OffsetDateTime withdrawnAt
) {
    public static AdminUserResponse from(User user) {
        return new AdminUserResponse(
                user.getId(),
                user.getEmail(),
                user.getNickname(),
                user.getRole(),
                user.getStatus(),
                user.getCreatedAt(),
                user.getWithdrawnAt()
        );
    }
}
