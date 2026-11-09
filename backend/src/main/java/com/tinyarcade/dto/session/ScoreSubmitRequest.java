package com.tinyarcade.dto.session;

import java.math.BigDecimal;

/**
 * POST /api/sessions/{sessionId}/submit 요청 { score }.
 * 점수 형식 검사(S-04)는 일반 입력값 오류(VALIDATION_ERROR)가 아니라 전용 코드 INVALID_SCORE로 답해야 해서
 * 여기 @Valid 대신 SessionService에서 직접 한다(01 A2 사유 코드).
 */
public record ScoreSubmitRequest(BigDecimal score) {
}
