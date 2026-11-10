package com.tinyarcade.service.leaderboard;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
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

    /**
     * [17번] 주차 키(예: "2026-W45") → 그 주의 범위 (03_17 마감·재마감에서 사용).
     *
     * [참고] 계산 방법
     * - ISO 규칙상 1월 4일은 항상 그 해의 1주차 안에 있다. 그래서 "주차 연도의 1월 4일"에서 출발해
     *   (주차 - 1)주를 더하면 그 주 안의 날짜가 된다. 그 날짜를 of()에 넣으면 월요일 0시 범위가 나온다.
     * - 2025-W53처럼 실제로 없는 주차(그 해가 52주까지만 있음)는 계산 결과 키가 입력과 달라진다.
     *   마지막에 "다시 만든 키 == 입력 키"인지 확인해서 이런 값을 걸러 낸다.
     *
     * @throws IllegalArgumentException 형식이 틀리거나 없는 주차일 때 (부르는 쪽에서 VALIDATION_ERROR로 바꾼다)
     */
    public static WeekRange ofKey(String key) {
        if (key == null || !key.matches("\\d{4}-W\\d{2}")) {
            throw new IllegalArgumentException("주차 키 형식이 아닙니다: " + key);
        }
        int year = Integer.parseInt(key.substring(0, 4));   // "2026-W45" → 2026
        int week = Integer.parseInt(key.substring(6));      // "2026-W45" → 45

        LocalDate dayInWeek = LocalDate.of(year, 1, 4).plusWeeks(week - 1L);
        WeekRange range = of(dayInWeek.atStartOfDay(KST).toInstant());
        if (!range.key().equals(key)) {
            throw new IllegalArgumentException("없는 주차입니다: " + key);
        }
        return range;
    }

    /** [17번] 한 주 전 (예: 이번 주가 2026-W46이면 2026-W45). 스케줄러가 "지난주"를 마감할 때 쓴다. */
    public WeekRange previous() {
        return of(start.minusWeeks(1).toInstant());
    }
}
