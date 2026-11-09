package com.tinyarcade.entity.session;

/**
 * 이상값 검증 상태 (01_core_logic_ranking A3).
 * - NORMAL: 이상값 검사에 걸리지 않음
 * - PENDING: 이상값으로 의심됨 → 리더보드에 "검증 중..." 표시, 관리자 확인 대기. 거부가 아니다
 * - APPROVED: 관리자가 인정했거나, 주간 마감까지 처리되지 않아 자동 인정
 */
public enum VerifyStatus {
    NORMAL, PENDING, APPROVED
}
