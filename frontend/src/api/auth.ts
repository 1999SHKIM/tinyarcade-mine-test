import type { User, UserRole } from '../types'
import api from './client'

// [계약: 김] 10번 인증 API (03_10_tinyarcade_auth §3)
//
// [공부 포인트]
// - interface: 주고받는 데이터의 "모양"을 TypeScript에 알려 준다. 필드 이름을 잘못 쓰면 빌드할 때 바로 오류가 난다.
//   이 모양은 백엔드 DTO(SignupRequest.java 등)와 똑같이 맞춘 것이다.
// - async/await: 서버 응답을 기다렸다가 다음 줄을 실행한다. 실패(4xx·5xx)하면 예외가 던져진다 → 화면에서 try-catch.
// - api.post<T>(...): 응답 본문의 타입이 T라고 알려 준다. { data }로 본문만 꺼낸다.

export interface SignupRequest {
  email: string
  password: string
  nickname: string
  ageConfirmed: boolean // 만 14세 이상 체크박스
}

export interface SignupResponse {
  id: number
  email: string
  nickname: string
}

export interface LoginResponse {
  accessToken: string // JWT. client.ts의 tokenStorage에 저장한다
  user: { id: number; email: string; nickname: string; role: UserRole }
}

/** POST /api/auth/signup → 201 */
export async function signup(body: SignupRequest): Promise<SignupResponse> {
  const { data } = await api.post<SignupResponse>('/auth/signup', body)
  return data
}

/** POST /api/auth/login → 200 { accessToken, user } */
export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', { email, password })
  return data
}

/** GET /api/users/me → 내 정보 (토큰은 client.ts가 자동으로 붙인다) */
export async function getMe(): Promise<User> {
  const { data } = await api.get<User>('/users/me')
  return data
}

export { api }
