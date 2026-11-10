package com.tinyarcade.dto.admin;

import com.tinyarcade.entity.session.PlaySession;
import com.tinyarcade.entity.user.User;
import com.tinyarcade.entity.user.UserStatus;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * 이상값 검증 대기 기록 응답 DTO (26번 이상값 검증 대기, 허 담당).
 */
public record AdminVerificationResponse(
        UUID sessionId,
        Long appId,
        String appTitle,
        BigDecimal appMaxScore,
        String userNickname,
        BigDecimal score,
        long playSeconds,
        OffsetDateTime submittedAt
) {
    public static AdminVerificationResponse from(PlaySession session) {
        User user = session.getUser();
        String nickname = (user != null && user.getStatus() == UserStatus.WITHDRAWN)
                ? user.getNickname() + " (탈퇴)"
                : (user != null ? user.getNickname() : "알 수 없음");

        long playSeconds = 0;
        if (session.getStartedAt() != null && session.getSubmittedAt() != null) {
            playSeconds = Duration.between(session.getStartedAt(), session.getSubmittedAt()).getSeconds();
        }

        return new AdminVerificationResponse(
                session.getId(),
                session.getApp().getId(),
                session.getApp().getTitle(),
                session.getApp().getMaxScore(),
                nickname,
                session.getScore(),
                playSeconds,
                session.getSubmittedAt()
        );
    }
}
