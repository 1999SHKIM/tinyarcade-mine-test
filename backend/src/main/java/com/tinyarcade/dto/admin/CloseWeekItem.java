package com.tinyarcade.dto.admin;

/**
 * 끝난 주차 목록 아이템 DTO (27번 수동 마감·목데이터 토글, 허 담당).
 */
public record CloseWeekItem(
        String periodKey,
        boolean closed
) {
}
