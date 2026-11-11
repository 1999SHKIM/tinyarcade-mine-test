package com.tinyarcade.dto.ranking;

/**
 * 유저 랭킹 기간 (03_17 §3-1, 결정 ④). 15번 앱 리더보드(LeaderboardPeriod)와 같은 이름을 쓴다.
 * ?period=WEEKLY 처럼 글자로 받으면 스프링이 이 enum으로 바꿔 준다. 다른 글자면 400 VALIDATION_ERROR.
 */
public enum RankingPeriod {
    /** 가장 최근에 마감된 주차 */
    WEEKLY,
    /** 마감된 모든 주차 합산 */
    ALL
}
