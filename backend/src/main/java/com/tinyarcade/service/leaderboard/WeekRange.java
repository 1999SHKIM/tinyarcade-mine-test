package com.tinyarcade.service.leaderboard;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.temporal.IsoFields;
import java.time.temporal.TemporalAdjusters;

/**
 * 한 주의 범위: 월요일 00:00 KST 이상 ~ 다음 월요일 00:00 KST 미만 (01_core_logic_ranking B1, 03_15 §2).
 *
 * [참고] 왜 KST로 바꿔서 계산하나
 * - 배포 서버(Render)의 시계는 UTC다. UTC 기준으로 "월요일"을 정하면 한국 시간으로는 월요일 오전 9시에 주가 바뀐다.
 * - 그래서 지금 시각을 먼저 한국 시간(Asia/Seoul)으로 바꾼 뒤 그 주의 월요일 0시를 찾는다.
 *   서버가 어느 나라 시계를 쓰든 결과가 같다(LB-N04).
 *
 * [참고] ISO 주차 키 (예: 2026-W46)
 * - ISO 8601 주차는 월요일에 시작한다. 그래서 우리 리셋 기준(월요일 0시)과 맞는다.
 * - 연말·연초에는 "주차 연도"가 달력 연도와 다를 수 있다(예: 2027-01-01(금)은 2026-W53).
 *   그래서 달력 연도(getYear)가 아니라 IsoFields.WEEK_BASED_YEAR를 쓴다.
 *
 * of(시각)은 같은 시각을 넣으면 항상 같은 범위를 돌려준다(바깥 상태를 읽지 않음).
 */
public record WeekRange(OffsetDateTime start, OffsetDateTime end, String key) {

    public static final ZoneId KST = ZoneId.of("Asia/Seoul");

    /** now가 속한 주 */
    public static WeekRange of(Instant now) {
        ZonedDateTime kst = now.atZone(KST);
        ZonedDateTime monday = kst.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).toLocalDate().atStartOfDay(KST);
        String key = String.format("%d-W%02d",
                monday.get(IsoFields.WEEK_BASED_YEAR), monday.get(IsoFields.WEEK_OF_WEEK_BASED_YEAR));
        return new WeekRange(monday.toOffsetDateTime(), monday.plusWeeks(1).toOffsetDateTime(), key);
    }

    /** 이번 주 */
    public static WeekRange current() {
        return of(Instant.now());
    }
}
