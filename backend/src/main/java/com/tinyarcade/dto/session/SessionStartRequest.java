package com.tinyarcade.dto.session;

import jakarta.validation.constraints.NotNull;

/** POST /api/sessions 요청 { appId } */
public record SessionStartRequest(
        @NotNull(message = "앱 번호(appId)가 필요합니다.")
        Long appId
) {
}
