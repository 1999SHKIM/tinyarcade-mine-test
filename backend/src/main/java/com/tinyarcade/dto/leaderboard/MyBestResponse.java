package com.tinyarcade.dto.leaderboard;

import java.math.BigDecimal;

/**
 * 내 최고 기록 (01 B3 "내 최고 점수", 03_15 결정 ②).
 * 요청한 기간(탭) 안에서 내 기록 중 리더보드 맨 위에 오는 것. 100위 밖이어도 순위를 계산한다.
 *
 * @param bestScore 내 최고 점수 (검증 중 기록 포함)
 * @param rank      그 기록의 순위 (허 화면 "주간 4위" 자리)
 */
public record MyBestResponse(BigDecimal bestScore, long rank) {
}
