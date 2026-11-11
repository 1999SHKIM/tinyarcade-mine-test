package com.tinyarcade.controller.ranking;

import com.tinyarcade.config.security.LoginUser;
import com.tinyarcade.dto.ranking.RankingPeriod;
import com.tinyarcade.dto.ranking.RankingResponse;
import com.tinyarcade.service.ranking.RankingService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 유저 랭킹 API (03_17 §3-1). 누구나 볼 수 있다(SecurityConfig permitAll).
 * - viewer: 로그인했으면 토큰의 유저, 아니면 null → 내 줄(isMe) 표시에만 쓴다.
 * - period가 없거나 WEEKLY·ALL이 아니면 스프링이 400 VALIDATION_ERROR로 응답한다(GlobalExceptionHandler).
 */
@RestController
@RequiredArgsConstructor
public class RankingController {

    private final RankingService rankingService;

    @GetMapping("/api/ranking")
    public RankingResponse ranking(@RequestParam RankingPeriod period,
                                   @AuthenticationPrincipal LoginUser viewer) {
        return rankingService.getRanking(period, viewer);
    }
}
