package com.tinyarcade.dto.app;

import com.tinyarcade.entity.app.App;
import com.tinyarcade.entity.app.AppStatus;
import com.tinyarcade.entity.user.User;
import com.tinyarcade.entity.user.UserStatus;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * 앱 응답 (03_11_tinyarcade_app §3). 칸 이름은 허의 frontend TinyApp 타입과 같게 맞췄다.
 *
 * [참고]
 * playUrl은 게임을 띄울 iframe 주소다. 게임 파일은 사이트(Vercel)가 아니라 Render 주소에서 전달되므로
 * "/apps/..."만 주면 안 되고 serveOrigin(예: https://tinyarcade.onrender.com)을 붙인 전체 주소가 필요하다.
 */
public record AppResponse(
        Long id,
        Long creatorId,
        String creatorNickname,
        String title,
        String description,
        String repoUrl,
        String commitSha,
        String entryPath,
        UUID deployKey,
        String playUrl,
        AppStatus status,
        String rejectReason,
        boolean isOfficial,
        BigDecimal maxScore,
        int recommendCount,
        int notRecommendCount,
        int playCount,
        OffsetDateTime approvedAt,
        OffsetDateTime createdAt
) {
    public static AppResponse from(App app, String serveOrigin) {
        User creator = app.getCreator();
        // 탈퇴한 크리에이터는 닉네임 대신 "탈퇴한 유저" (메인 §4)
        String nickname = creator.getStatus() == UserStatus.WITHDRAWN ? "탈퇴한 유저" : creator.getNickname();
        return new AppResponse(
                app.getId(), creator.getId(), nickname,
                app.getTitle(), app.getDescription(), app.getRepoUrl(),
                app.getCommitSha(), app.getEntryPath(), app.getDeployKey(),
                serveOrigin + "/apps/" + app.getDeployKey() + "/" + app.getEntryPath(),
                app.getStatus(), app.getRejectReason(), app.isOfficial(), app.getMaxScore(),
                app.getRecommendCount(), app.getNotRecommendCount(), app.getPlayCount(),
                app.getApprovedAt(), app.getCreatedAt());
    }
}
