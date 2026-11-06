import type { User, UserRole } from '../types'
import api from './client'

// [계약: 김] 10번 인증 API (03_10_tinyarcade_auth §3)

export interface SignupRequest {
  email: string
  password: string
  nickname: string
  ageConfirmed: boolean
}

export interface SignupResponse {
  id: number
  email: string
  nickname: string
}

export interface LoginResponse {
  accessToken: string
  user: { id: number; email: string; nickname: string; role: UserRole }
}

export async function signup(body: SignupRequest): Promise<SignupResponse> {
  const { data } = await api.post<SignupResponse>('/auth/signup', body)
  return data
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', { email, password })
  return data
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>('/users/me')
  return data
}

export { api }
