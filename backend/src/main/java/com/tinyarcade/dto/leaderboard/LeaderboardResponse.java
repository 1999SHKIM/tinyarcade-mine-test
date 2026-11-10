package com.tinyarcade.dto.leaderboard;

import java.util.List;

/**
 * 리더보드 응답 (03_15 §3-1). 목록과 내 기록을 한 번에 준다(결정 ②).
 *
 * @param periodKey 주간이면 ISO 주차(예: 2026-W46), 누적이면 null
 * @param entries   상위 100줄 (순위 1, 2, 3… 연속)
 * @param me        비로그인이거나 그 기간에 내 기록이 없으면 null
 */
public record LeaderboardResponse(
        LeaderboardPeriod period,
        String periodKey,
        List<LeaderboardEntryResponse> entries,
        MyBestResponse me
) {
}
