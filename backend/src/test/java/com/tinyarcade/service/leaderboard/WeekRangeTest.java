package com.tinyarcade.service.leaderboard;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.time.OffsetDateTime;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * 주차 키 처리 테스트 (03_17 WeekRange.ofKey / previous, 01 B1).
 *
 * [참고] 시간 비교
 * - start는 한국 시간(+09:00)으로 나온다. 기대값도 +09:00으로 적어 "월요일 0시 KST"인지 바로 보이게 했다.
 */
@DisplayName("주차 키 (WeekRange)")
class WeekRangeTest {

    @Test
    @DisplayName("2026-W45 → 2026-11-02(월) 00:00 KST ~ 2026-11-09 00:00 KST")
    void ofKey_normalWeek_returnsMondayRange() {
        WeekRange range = WeekRange.ofKey("2026-W45");
        assertEquals(OffsetDateTime.parse("2026-11-02T00:00+09:00"), range.start());
        assertEquals(OffsetDateTime.parse("2026-11-09T00:00+09:00"), range.end());
        assertEquals("2026-W45", range.key());
    }

    @Test
    @DisplayName("연말 주차 2026-W53은 2026-12-28(월)에 시작한다 (주차 연도 ≠ 달력 연도)")
    void ofKey_week53_returnsLastWeekOfYear() {
        WeekRange range = WeekRange.ofKey("2026-W53");
        assertEquals(OffsetDateTime.parse("2026-12-28T00:00+09:00"), range.start());
    }

    @Test
    @DisplayName("2026-W01의 한 주 전은 2025-W52 (연도 넘김)")
    void previous_firstWeek_returnsLastWeekOfPreviousYear() {
        assertEquals("2025-W52", WeekRange.ofKey("2026-W01").previous().key());
    }

    @Test
    @DisplayName("2026-W46의 한 주 전은 2026-W45")
    void previous_normalWeek_returnsWeekBefore() {
        assertEquals("2026-W45", WeekRange.ofKey("2026-W46").previous().key());
    }

    @Test
    @DisplayName("형식이 틀리거나 없는 주차(2025-W53, W00, W60)는 거부")
    void ofKey_invalidKey_throwsException() {
        assertThrows(IllegalArgumentException.class, () -> WeekRange.ofKey("2026-45"));
        assertThrows(IllegalArgumentException.class, () -> WeekRange.ofKey(null));
        assertThrows(IllegalArgumentException.class, () -> WeekRange.ofKey("2025-W53"));
        assertThrows(IllegalArgumentException.class, () -> WeekRange.ofKey("2026-W00"));
        assertThrows(IllegalArgumentException.class, () -> WeekRange.ofKey("2026-W60"));
    }
}
