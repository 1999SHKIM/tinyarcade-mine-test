import api from './client'

/** 마이페이지: 앱별 내 최고 점수 한 줄 */
export interface MyBestScore {
  appId: number
  appTitle: string
  bestScore: number
  playCount: number
  lastPlayedAt: string
}

/** PATCH /api/mypage/password : 비밀번호 변경 */
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await api.patch('/mypage/password', { currentPassword, newPassword })
}

/** POST /api/mypage/withdraw : 회원 탈퇴 */
export async function withdraw(password: string): Promise<void> {
  await api.post('/mypage/withdraw', { password })
}

/** GET /api/mypage/best-scores : 앱별 내 최고 점수 목록 */
export async function getMyBestScores(): Promise<MyBestScore[]> {
  const { data } = await api.get<MyBestScore[]>('/mypage/best-scores')
  return data
}

export { api }
