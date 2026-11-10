import type { AppResponse } from './apps'
import type { AppStatus, UserRole, UserStatus } from '../types'
import api from './client'

// [허 담당] 어드민 API (24 유저 관리 · 25 앱 관리 · 26 이상값 검증 대기)

// ── 25. 앱 관리 ──

/** GET /api/admin/apps (status 선택: PENDING | APPROVED | REJECTED, 없으면 전체) */
export async function getAdminApps(status?: AppStatus): Promise<AppResponse[]> {
  const { data } = await api.get<AppResponse[]>('/admin/apps', {
    params: status ? { status } : undefined,
  })
  return data
}

/** POST /api/admin/apps/{id}/approve */
export async function approveAdminApp(id: number): Promise<AppResponse> {
  const { data } = await api.post<AppResponse>(`/admin/apps/${id}/approve`)
  return data
}

/** POST /api/admin/apps/{id}/reject */
export async function rejectAdminApp(id: number, reason: string): Promise<AppResponse> {
  const { data } = await api.post<AppResponse>(`/admin/apps/${id}/reject`, { reason })
  return data
}

/** DELETE /api/admin/apps/{id} */
export async function deleteAdminApp(id: number): Promise<void> {
  await api.delete(`/admin/apps/${id}`)
}

// ── 24. 유저 관리 ──

export interface AdminUserResponse {
  id: number
  email: string
  nickname: string
  role: UserRole
  status: UserStatus
  createdAt: string
  withdrawnAt: string | null
}

/** GET /api/admin/users (전체 유저 목록, 최근 가입순) */
export async function getAdminUsers(): Promise<AdminUserResponse[]> {
  const { data } = await api.get<AdminUserResponse[]>('/admin/users')
  return data
}

/** POST /api/admin/users/{id}/suspend (정지: ACTIVE -> SUSPENDED) */
export async function suspendAdminUser(id: number): Promise<AdminUserResponse> {
  const { data } = await api.post<AdminUserResponse>(`/admin/users/${id}/suspend`)
  return data
}

/** POST /api/admin/users/{id}/activate (해제: SUSPENDED -> ACTIVE) */
export async function activateAdminUser(id: number): Promise<AdminUserResponse> {
  const { data } = await api.post<AdminUserResponse>(`/admin/users/${id}/activate`)
  return data
}

export { api }
