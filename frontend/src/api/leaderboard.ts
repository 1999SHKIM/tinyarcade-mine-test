import type { LeaderboardEntry } from '../types'
import api from './client'

// [계약: 김] 15번 앱 리더보드 API (03_15_tinyarcade_leaderboard §3)
//
// [참고]
// - 주소 하나에 기간만 바꿔 부른다. 주간 탭 → 'WEEKLY', 누적 탭 → 'ALL'
// - entries의 각 줄은 허의 LeaderboardEntry 타입과 칸 이름이 같다. 목 데이터 자리에 그대로 넣으면 된다.
//   - 탈퇴 유저는 서버가 이미 nickname을 "탈퇴한 유저"로 바꿔서 보낸다(userStatus: 'WITHDRAWN'도 함께).
//   - submittedAt은 시각 문자열(UTC)이다. "11.04 14:20 달성" 같은 표시는 new Date(submittedAt)로 만든다.
// - me: 로그인했고 그 기간에 내 기록이 있으면 { bestScore, rank }, 아니면 null
// - 점수 제출이 끝나면(GameFrame의 onScoreSubmitted) 보고 있는 탭을 다시 불러야 새 기록이 보인다.
// - 승인 대기·반려 앱은 본인·관리자만 볼 수 있다(그 밖은 404 APP_NOT_FOUND, 앱 상세와 같은 규칙).

export type LeaderboardPeriod = 'WEEKLY' | 'ALL'

export interface MyBest {
  /** 그 기간 내 최고 점수 (검증 중 기록 포함) */
  bestScore: number
  /** 그 기록의 순위 (100위 밖이어도 실제 순위) */
  rank: number
}

export interface LeaderboardResponse {
  period: LeaderboardPeriod
  /** 주간이면 ISO 주차 (예: '2026-W46'), 누적이면 null */
  periodKey: string | null
  /** 상위 100줄, 순위 1, 2, 3… */
  entries: LeaderboardEntry[]
  me: MyBest | null
}

/** GET /api/apps/{appId}/leaderboard?period= (누구나) */
export async function getLeaderboard(appId: number, period: LeaderboardPeriod): Promise<LeaderboardResponse> {
  const { data } = await api.get<LeaderboardResponse>(`/apps/${appId}/leaderboard`, { params: { period } })
  return data
}

export { api }
