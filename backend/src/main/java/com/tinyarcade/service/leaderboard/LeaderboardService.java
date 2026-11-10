package com.tinyarcade.service.leaderboard;

import com.tinyarcade.config.security.LoginUser;
import com.tinyarcade.dao.leaderboard.LeaderboardDao;
import com.tinyarcade.dto.leaderboard.LeaderboardEntryResponse;
import com.tinyarcade.dto.leaderboard.LeaderboardPeriod;
import com.tinyarcade.dto.leaderboard.LeaderboardResponse;
import com.tinyarcade.dto.leaderboard.MyBestResponse;
import com.tinyarcade.entity.app.App;
import com.tinyarcade.entity.user.UserStatus;
import com.tinyarcade.service.app.AppService;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 앱 리더보드 규칙 (01_core_logic_ranking Part B, 03_15_tinyarcade_leaderboard).
 *
 * [참고] 흐름
 * 1. 앱을 볼 수 있는지 확인 (11번 상세와 같은 규칙, 아니면 404)
 * 2. 기간 정하기: 주간이면 이번 주 범위, 누적이면 범위 없음
 * 3. 목록 100줄 (순위는 SQL이 1, 2, 3… 붙여 줌)
 * 4. 로그인했으면 내 최고 기록과 순위 → me (비로그인이면 null)
 * 5. 화면용으로 다듬기: 내 기록 줄 isMe, 탈퇴 유저 닉네임 → "탈퇴한 유저"
 *
 * [참고] 이 화면은 "점수 순위표"일 뿐이다
 * - 주간 1등 자격(크리에이터 본인 제외 등)이나 랭킹 포인트는 여기서 계산하지 않는다(01 B2, LB-N03).
 *   그래서 리더보드 1위와 유저 랭킹의 "주간 1등"(17번)은 다를 수 있다(메인 §6).
 */
@Service
public class LeaderboardService {

    private static final String WITHDRAWN_NICKNAME = "탈퇴한 유저";

    private final AppService appService;
    private final LeaderboardDao leaderboardDao;
    private final int topN;

    public LeaderboardService(AppService appService, LeaderboardDao leaderboardDao,
                              @Value("${ranking.leaderboard.top-n}") int topN) {
        this.appService = appService;
        this.leaderboardDao = leaderboardDao;
        this.topN = topN;
    }

    /** @param viewer 로그인하지 않았으면 null (정지·탈퇴 유저의 토큰도 null로 들어온다) */
    @Transactional(readOnly = true)
    public LeaderboardResponse getLeaderboard(Long appId, LeaderboardPeriod period, LoginUser viewer) {
        App app = appService.findVisibleApp(appId, viewer);   // 볼 수 없으면 여기서 404
        int season = app.getCurrentSeason();
        WeekRange week = null;   // 누적이면 기간 조건 없음
        if (period == LeaderboardPeriod.WEEKLY) {
            week = WeekRange.current();
        }

        Long viewerId = null;   // 비로그인이면 null
        if (viewer != null) {
            viewerId = viewer.id();
        }

        // 목록: DB에서 읽은 줄을 화면용으로 다듬는다
        List<LeaderboardEntryResponse> entries = new ArrayList<>();
        for (LeaderboardDao.Row row : leaderboardDao.findTop(appId, season, week, topN)) {
            String nickname = row.nickname();
            if (row.userStatus() == UserStatus.WITHDRAWN) {
                nickname = WITHDRAWN_NICKNAME;   // 탈퇴 유저는 실제 닉네임을 응답에 싣지 않는다 (LB-F09)
            }
            boolean isMe = row.userId().equals(viewerId);
            entries.add(new LeaderboardEntryResponse(row.sessionId(), (int) row.rank(), row.userId(), nickname,
                    row.userStatus(), row.score(), row.submittedAt(), row.verifyStatus(), isMe));
        }

        // 내 최고 기록: 로그인했고 그 기간에 내 기록이 있을 때만 (LB-F07)
        MyBestResponse me = null;
        if (viewerId != null) {
            Optional<LeaderboardDao.MyBest> best = leaderboardDao.findMyBest(appId, season, week, viewerId);
            if (best.isPresent()) {
                me = new MyBestResponse(best.get().score(), best.get().rank());
            }
        }

        String periodKey = null;   // 누적이면 null
        if (week != null) {
            periodKey = week.key();
        }
        return new LeaderboardResponse(period, periodKey, entries, me);
    }
}
