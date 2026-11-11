package com.tinyarcade.dto.mypage;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * GET /api/mypage/best-scores 응답 한 줄.
 * 앱별 최고 점수, 플레이 횟수, 마지막 플레이 시각.
 */
public record MyBestScoreResponse(
        Long appId,
        String appTitle,
        BigDecimal bestScore,
        long playCount,
        OffsetDateTime lastPlayedAt
) {
}
