package com.tinyarcade.dto.session;

import com.tinyarcade.entity.session.VerifyStatus;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * POST /api/sessions/{sessionId}/submit 응답 (03_12 §3-2).
 * verifyStatus가 PENDING이면 리더보드에 "검증 중..."으로 보인다(거부 아님).
 */
public record ScoreSubmitResponse(UUID sessionId, Long appId, BigDecimal score,
                                  OffsetDateTime submittedAt, VerifyStatus verifyStatus) {
}
