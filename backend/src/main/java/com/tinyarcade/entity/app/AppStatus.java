package com.tinyarcade.entity.app;

/**
 * 앱 상태 (메인 명세 §5 앱 생애주기).
 * - PENDING: 등록됨·승인 대기. 미리보기로만 실행(본인·관리자에게만 플랫폼에 보임)
 * - APPROVED: 승인됨·목록에 공개
 * - REJECTED: 반려됨(사유 있음). 고치면 새로 등록한다
 */
public enum AppStatus {
    PENDING, APPROVED, REJECTED
}
