package com.tinyarcade.controller.leaderboard;

import com.tinyarcade.config.security.LoginUser;
import com.tinyarcade.dto.leaderboard.LeaderboardPeriod;
import com.tinyarcade.dto.leaderboard.LeaderboardResponse;
import com.tinyarcade.service.leaderboard.LeaderboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 앱 리더보드 API (03_15_tinyarcade_leaderboard §3-1).
 *
 * [참고]
 * - 주소 하나에 기간만 바꿔 부른다: ?period=WEEKLY(주간 탭) / ?period=ALL(누적 탭) (결정 ①)
 * - 누구나 부를 수 있는 주소다(SecurityConfig). 로그인했으면 @AuthenticationPrincipal에 내 정보가,
 *   아니면 null이 들어온다. 서비스는 null이면 "내 기록(me)" 없이 목록만 준다.
 * - period가 없거나 WEEKLY·ALL이 아니면 스프링이 enum으로 바꾸지 못해 400 VALIDATION_ERROR가 된다.
 */
@RestController
@RequiredArgsConstructor
public class LeaderboardController {

    private final LeaderboardService leaderboardService;

    @GetMapping("/api/apps/{appId}/leaderboard")
    public LeaderboardResponse leaderboard(@PathVariable Long appId,
                                           @RequestParam LeaderboardPeriod period,
                                           @AuthenticationPrincipal LoginUser viewer) {
        return leaderboardService.getLeaderboard(appId, period, viewer);
    }
}
