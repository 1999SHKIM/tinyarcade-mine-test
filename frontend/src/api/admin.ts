import type { AppResponse } from './apps'
import type { AppStatus, UserRole, UserStatus } from '../types'
import api from './client'

// [허 담당] 어드민 API (24 유저 관리 · 25 앱 관리 · 26 이상값 검증 대기 · 27 수동 마감·목데이터 토글)

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

// ── 26. 이상값 검증 대기 ──

export interface AdminVerification {
  sessionId: string
  appId: number
  appTitle: string
  appMaxScore: number | null
  userNickname: string
  score: number
  playSeconds: number
  submittedAt: string
}

/** GET /api/admin/verifications (이상값 검증 대기 목록, 최근 제출순) */
export async function getAdminVerifications(): Promise<AdminVerification[]> {
  const { data } = await api.get<AdminVerification[]>('/admin/verifications')
  return data
}

/** POST /api/admin/verifications/{sessionId}/approve (인정: PENDING -> APPROVED) */
export async function approveAdminVerification(sessionId: string): Promise<void> {
  await api.post(`/admin/verifications/${sessionId}/approve`)
}

/** DELETE /api/admin/verifications/{sessionId} (삭제: 행 삭제 + play_count 1 감소) */
export async function deleteAdminVerification(sessionId: string): Promise<void> {
  await api.delete(`/admin/verifications/${sessionId}`)
}

// ── 27. 수동 마감·목데이터 토글 ──

export interface CloseRecord {
  appId: number
  appTitle: string
  userId: number
  nickname: string
  recommendAtClose: number
  participantsAtClose: number
  coefficient: number
  points: number
}

export interface CloseResult {
  periodKey: string
  mockIncluded: boolean
  appCount: number
  records: CloseRecord[]
}

export interface CloseWeekItem {
  periodKey: string
  closed: boolean
}

export interface MockSettingResponse {
  enabled: boolean
}

/** GET /api/admin/close/preview (이번 주 미리보기) */
export async function getClosePreview(): Promise<CloseResult> {
  const { data } = await api.get<CloseResult>('/admin/close/preview')
  return data
}

/** GET /api/admin/close/weeks (끝난 주차 최근 8개와 마감 여부) */
export async function getCloseWeeks(): Promise<CloseWeekItem[]> {
  const { data } = await api.get<CloseWeekItem[]>('/admin/close/weeks')
  return data
}

/** POST /api/admin/close/weeks/{periodKey} (끝난 주차 재마감) */
export async function closeWeek(periodKey: string): Promise<CloseResult> {
  const { data } = await api.post<CloseResult>(`/admin/close/weeks/${periodKey}`)
  return data
}

/** GET /api/admin/settings/mock (목데이터 토글 조회) */
export async function getMockSetting(): Promise<MockSettingResponse> {
  const { data } = await api.get<MockSettingResponse>('/admin/settings/mock')
  return data
}

/** PUT /api/admin/settings/mock (목데이터 토글 변경) */
export async function setMockSetting(enabled: boolean): Promise<MockSettingResponse> {
  const { data } = await api.put<MockSettingResponse>('/admin/settings/mock', { enabled })
  return data
}

export { api }
