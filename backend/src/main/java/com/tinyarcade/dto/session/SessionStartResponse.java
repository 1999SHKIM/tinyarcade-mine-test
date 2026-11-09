package com.tinyarcade.dto.session;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * POST /api/sessions 응답 (03_12 §3-2).
 * 미리보기(승인 대기 앱)는 testMode = true, sessionId·startedAt = null (DB에 기록하지 않음, 01 A1).
 */
public record SessionStartResponse(UUID sessionId, Long appId, OffsetDateTime startedAt, boolean testMode) {

    public static SessionStartResponse started(UUID sessionId, Long appId, OffsetDateTime startedAt) {
        return new SessionStartResponse(sessionId, appId, startedAt, false);
    }

    public static SessionStartResponse testMode(Long appId) {
        return new SessionStartResponse(null, appId, null, true);
    }
}
