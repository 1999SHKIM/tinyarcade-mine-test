import type { VoteType } from '../types'
import api from './client'

// [계약: 김] 16번 추천·비추천 API (03_16_tinyarcade_vote §3)
//
// [참고]
// - 상세 화면이 열릴 때 getMyVote(appId) → myVote(처음 눌려 있는 버튼), hasPlayed(플레이 여부)
// - 버튼을 누르면 vote(appId, 'RECOMMEND' 또는 'NOT_RECOMMEND') → 응답의 숫자로 화면을 바꾼다
//   (같은 버튼을 다시 누르면 취소되어 myVote가 null로 온다. 화면이 직접 +1/-1 계산하지 않아도 된다)
// - 플레이하지 않았으면 403 PLAY_REQUIRED, 비로그인이면 401 → getErrorMessage로 안내

export interface VoteResponse {
  /** 지금 내 표. 취소했으면 null */
  myVote: VoteType | null
  recommendCount: number
  notRecommendCount: number
}

export interface MyVoteResponse {
  myVote: VoteType | null
  /** 이 앱을 1번 이상 플레이(점수 제출)했는가. 비로그인이면 false */
  hasPlayed: boolean
}

/** POST /api/apps/{appId}/votes (로그인 필요) */
export async function vote(appId: number, voteType: VoteType): Promise<VoteResponse> {
  const { data } = await api.post<VoteResponse>(`/apps/${appId}/votes`, { voteType })
  return data
}

/** GET /api/apps/{appId}/votes/me (누구나) */
export async function getMyVote(appId: number): Promise<MyVoteResponse> {
  const { data } = await api.get<MyVoteResponse>(`/apps/${appId}/votes/me`)
  return data
}

export { api }
