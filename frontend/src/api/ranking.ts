import type { OverallRankingEntry } from '../types'
import api from './client'

// [계약: 김] 17번 유저 랭킹 API (03_17_tinyarcade_ranking §3-1)
//
// [참고]
// - 주소 하나에 기간만 바꿔 부른다. 주간 탭 → 'WEEKLY', 누적 탭 → 'ALL' (15번 앱 리더보드와 같은 방식)
// - entries의 각 줄은 허의 OverallRankingEntry 타입과 칸 이름이 같다. 목 데이터 자리에 그대로 넣으면 된다.
//   - handle, highlightNote는 우리 서비스에 없는 값이라 서버가 항상 null로 보낸다.
//   - 탈퇴 유저는 nickname이 "탈퇴한 유저", 삭제된 앱은 firstPlaceApps에 "삭제된 앱"으로 온다.
//   - totalPoints는 소수 둘째 자리까지 (예: 212.12)
//   - 동점이면 rank가 같다 (1, 1, 3)
// - 주간 = 가장 최근에 마감된 주차. periodKey로 "(2026-W45)" 같은 표시를 채울 수 있다.
//   마감된 주차가 아직 없으면 periodKey는 null, entries는 빈 배열이다.
// - 누적이면 periodKey는 null이다.

export type RankingPeriod = 'WEEKLY' | 'ALL'

export interface RankingResponse {
  period: RankingPeriod
  /** 주간이면 보여 주는 주차 (예: '2026-W45'), 누적이거나 마감된 주차가 없으면 null */
  periodKey: string | null
  entries: OverallRankingEntry[]
}

/** GET /api/ranking?period= (누구나, 로그인했으면 내 줄에 isMe: true) */
export async function getRanking(period: RankingPeriod): Promise<RankingResponse> {
  const { data } = await api.get<RankingResponse>('/ranking', { params: { period } })
  return data
}

export { api }
