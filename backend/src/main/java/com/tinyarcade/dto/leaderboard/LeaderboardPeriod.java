package com.tinyarcade.dto.leaderboard;

/**
 * 리더보드 기간 (03_15 결정 ①). 주소 뒤 ?period=WEEKLY 또는 ?period=ALL로 받는다.
 *
 * [참고] 주소 값을 enum으로 받으면
 * - 스프링이 글자를 enum으로 자동으로 바꿔 준다. WEEKLY·ALL이 아니면(소문자 포함) 바꾸기에 실패해서
 *   GlobalExceptionHandler가 400 VALIDATION_ERROR로 답한다. 따로 검사 코드를 쓰지 않아도 된다.
 */
public enum LeaderboardPeriod {
    /** 이번 주 (월요일 00:00 KST부터) */
    WEEKLY,
    /** 앱의 현재 시즌 전체 */
    ALL
}
