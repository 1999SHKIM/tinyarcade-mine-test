package com.tinyarcade.dto.ranking;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * GET /api/ranking 응답 (03_17 §3-1).
 * - periodKey: 주간이면 보여 주는 주차(예: 2026-W45), 누적이면 null. 마감된 주차가 하나도 없으면 null + 빈 목록.
 */
@Getter
@AllArgsConstructor
public class RankingResponse {
    private final RankingPeriod period;
    private final String periodKey;
    private final List<RankingEntryResponse> entries;
}
