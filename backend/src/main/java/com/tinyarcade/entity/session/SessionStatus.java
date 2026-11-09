package com.tinyarcade.entity.session;

/**
 * 세션 상태 (01_core_logic_ranking A1 세션 생애주기).
 * - OPEN: 게임 시작됨, 아직 점수 제출 전
 * - SUBMITTED: 점수 제출 완료 = "플레이 1회"로 인정 (메인 §5 플레이 인정 기준)
 * - EXPIRED: 시작 후 60분이 지나 제출하려다 거부됨
 */
public enum SessionStatus {
    OPEN, SUBMITTED, EXPIRED
}
