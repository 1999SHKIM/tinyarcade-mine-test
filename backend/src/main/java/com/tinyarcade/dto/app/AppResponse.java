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
        OffsetDateTime createdAt,
        String thumbnailUrl,         // [썸네일] 이미지 주소. 없으면 null
        BigDecimal weeklyTopScore,   // [15번] 이번 주 리더보드 1위 점수. 이번 주 기록이 없으면 null
        int weeklyParticipants       // [15번] 이번 주 점수를 낸 서로 다른 유저 수. 없으면 0
) {
    /**
     * 앱 → 응답.
     *
     * @param hasThumbnail       [썸네일] true면 thumbnailUrl = "/api/apps/{id}/thumbnail", false면 null.
     *                           사이트 주소 기준(/api로 시작)이라 화면에서 img src에 그대로 넣으면 Vercel이 Render로 넘겨 준다.
     * @param weeklyTopScore     [15번] 이번 주 리더보드 1위 점수. 이번 주 기록이 없으면 null
     * @param weeklyParticipants [15번] 이번 주 점수를 낸 서로 다른 유저 수. 없으면 0
     *                           (앱 카드의 "주간 1위: 2850점", "이번 주 도전자 12명". 허 TinyApp 타입에 이미 있는 칸)
     */
    public static AppResponse from(App app, String serveOrigin, boolean hasThumbnail,
                                   BigDecimal weeklyTopScore, int weeklyParticipants) {
        User creator = app.getCreator();
        // 탈퇴한 크리에이터는 닉네임 대신 "탈퇴한 유저" (메인 §4)
        String nickname = creator.getStatus() == UserStatus.WITHDRAWN ? "탈퇴한 유저" : creator.getNickname();
        String playUrl = serveOrigin + "/apps/" + app.getDeployKey() + "/" + app.getEntryPath();
        String thumbnailUrl = hasThumbnail ? "/api/apps/" + app.getId() + "/thumbnail" : null;
        return new AppResponse(
                app.getId(), creator.getId(), nickname,
                app.getTitle(), app.getDescription(), app.getRepoUrl(),
                app.getCommitSha(), app.getEntryPath(), app.getDeployKey(), playUrl,
                app.getStatus(), app.getRejectReason(), app.isOfficial(), app.getMaxScore(),
                app.getRecommendCount(), app.getNotRecommendCount(), app.getPlayCount(),
                app.getApprovedAt(), app.getCreatedAt(),
                thumbnailUrl, weeklyTopScore, weeklyParticipants);
    }

    /**
     * 썸네일·주간 값 없이 만들기 (thumbnailUrl = null, 주간 값 null·0).
     * 허의 어드민 작업(feature/admin의 AdminAppService)이 이 모양으로 부르고 있어서 남겨 둔다.
     */
    public static AppResponse from(App app, String serveOrigin) {
        return from(app, serveOrigin, false, null, 0);
    }
}
