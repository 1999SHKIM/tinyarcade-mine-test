package com.tinyarcade.dto.ranking;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 마감·미리보기 결과 중 앱 하나의 1등 (03_17 §3-2 CloseResult.records).
 * 허 어드민 화면(27번)이 이 값을 표로 보여 준다.
 */
@Getter
@AllArgsConstructor
public class CloseRecord {
    private final Long appId;
    private final String appTitle;
    private final Long userId;              // 1등 유저
    private final String nickname;
    private final int recommendAtClose;     // 앱 누적 추천 수
    private final int participantsAtClose;  // 그 주 참여자 수
    private final BigDecimal coefficient;   // 계수 (소수 4자리)
    private final BigDecimal points;        // 포인트 = 100 × 계수 (소수 2자리)
}
