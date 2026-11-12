package com.tinyarcade.dto.admin;

/**
 * 목데이터 설정 응답 DTO (27번 수동 마감·목데이터 토글, 허 담당).
 */
public record MockSettingResponse(
        boolean enabled
) {
}
