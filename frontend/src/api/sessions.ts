import api from './client'

// [김] 12번 세션 시작·점수 제출 API (03_12_tinyarcade_session §3-2)
//
// [공부 포인트]
// - 게임(iframe)은 이 함수를 직접 부르지 못한다. 게임은 postMessage로 "시작/점수"를 알리고,
//   플랫폼 화면의 sdkBridge(13번)가 이 함수를 불러 서버와 대화한다. (게임이 로그인 토큰을 못 보게 하려고)
// - 실패하면 { code, message }가 오고, code로 상황을 구분해 게임에 TINYARCADE_ERROR로 전달하면 된다.
//   예: SESSION_ALREADY_SUBMITTED(이미 제출), SESSION_EXPIRED(60분 초과), INVALID_SCORE(점수 형식), APP_NOT_FOUND

export interface SessionStartResponse {
  /** 미리보기(테스트 모드)면 null */
  sessionId: string | null
  appId: number
  startedAt: string | null
  /** true면 승인 대기 앱의 미리보기: 기록하지 않음. 제출 API를 부르지 말고 바로 완료 처리 */
  testMode: boolean
}

export type VerifyStatus = 'NORMAL' | 'PENDING' | 'APPROVED'

export interface ScoreSubmitResponse {
  sessionId: string
  appId: number
  score: number
  submittedAt: string
  /** PENDING이면 리더보드에 "검증 중..."으로 표시 (거부 아님) */
  verifyStatus: VerifyStatus
}

/** POST /api/sessions (로그인 필요) → 승인 앱 201 / 미리보기 200 testMode */
export async function startSession(appId: number): Promise<SessionStartResponse> {
  const { data } = await api.post<SessionStartResponse>('/sessions', { appId })
  return data
}

/** POST /api/sessions/{sessionId}/submit (로그인 필요) → 점수 기록 */
export async function submitScore(sessionId: string, score: number): Promise<ScoreSubmitResponse> {
  const { data } = await api.post<ScoreSubmitResponse>(`/sessions/${sessionId}/submit`, { score })
  return data
}

export { api }
