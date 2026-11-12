package com.tinyarcade.dto.admin;

/**
 * 목데이터 설정 변경 요청 DTO (27번 수동 마감·목데이터 토글, 허 담당).
 */
public record MockSettingRequest(
        boolean enabled
) {
}
