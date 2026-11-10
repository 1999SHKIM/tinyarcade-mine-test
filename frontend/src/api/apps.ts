import type { TinyApp } from '../types'
import api from './client'

// [계약: 김] 11번 앱 등록·배포 API (03_11_tinyarcade_app §3)
//
// [공부 포인트]
// - 응답은 허의 TinyApp 타입과 칸 이름이 같다. 서버만 주는 칸(playUrl, approvedAt)은 아래 AppResponse로 덧붙였다.
//   (허의 types/index.ts는 고치지 않기 위해 여기서 확장한다: interface A extends B = "B의 칸 + 새 칸")
// - categoryTag, bannerUrl은 서버가 주지 않는다(03_11 결정). 화면에서는 비어 있게 된다.
//   썸네일은 thumbnailUrl로 준다(03_11_tinyarcade_thumbnail, 허 요청).
// - 목록은 승인된 앱 "전체"를 한 번에 준다. 정렬·필터·검색은 화면(AppListPage)에서 지금처럼 하면 된다.

export interface AppResponse extends TinyApp {
  /** 게임을 띄울 iframe 주소 (Render 주소, 미리보기·플레이 공용). PlayModal의 src로 넘긴다 */
  playUrl: string
  approvedAt: string | null
  /** [썸네일] 이미지 주소 (예: /api/apps/5/thumbnail). img src에 그대로 넣으면 된다. 없으면 null */
  thumbnailUrl: string | null
}

export interface AppRegisterRequest {
  title: string
  description: string
  /** https://github.com/아이디/레포이름 (공개 레포) */
  repoUrl: string
  /** 진입 HTML 경로. 비우면 index.html */
  entryPath?: string
  /** 선택. 고정된 최고 점수가 있는 게임만 */
  maxScore?: number | null
}

/**
 * POST /api/apps (로그인 필요) → 201, 상태 PENDING
 *
 * [썸네일] thumbnail(png·jpg·webp, 500KB 이하)을 넘기면 앱 정보와 함께 한 번에 보낸다 (03_11_tinyarcade_thumbnail).
 * - 둘 중 하나라도 잘못되면 등록 전체가 실패한다(앱만 저장되는 일 없음).
 * - 썸네일 오류 code: INVALID_THUMBNAIL(형식), THUMBNAIL_TOO_LARGE(500KB 초과)
 * - thumbnail을 안 넘기면 지금과 똑같이 동작한다.
 *
 * [참고] FormData (multipart/form-data)
 * - 파일은 JSON에 담을 수 없어서, 칸을 나눠 담는 FormData로 보낸다.
 * - data 칸에는 앱 정보 JSON을 "application/json 종류의 Blob"으로 넣는다. 그래야 서버가 JSON으로 읽는다.
 * - Content-Type은 직접 정하지 않는다. 브라우저가 칸 구분 표시(boundary)까지 넣어 자동으로 정한다.
 */
export async function registerApp(body: AppRegisterRequest, thumbnail?: File | null): Promise<AppResponse> {
  if (!thumbnail) {
    const { data } = await api.post<AppResponse>('/apps', body)
    return data
  }
  const form = new FormData()
  form.append('data', new Blob([JSON.stringify(body)], { type: 'application/json' }))
  form.append('thumbnail', thumbnail)
  const { data } = await api.post<AppResponse>('/apps', form)
  return data
}

/** GET /api/apps → 승인된 앱 전체 (추천순 → 최근 승인순) */
export async function getApps(): Promise<AppResponse[]> {
  const { data } = await api.get<AppResponse[]>('/apps')
  return data
}

/** GET /api/apps/{id} → 승인 앱은 누구나, 대기·반려 앱은 본인·관리자만 (그 외 404 APP_NOT_FOUND) */
export async function getApp(appId: number): Promise<AppResponse> {
  const { data } = await api.get<AppResponse>(`/apps/${appId}`)
  return data
}

/** GET /api/apps/me (로그인 필요) → 내 앱 전체 (모든 상태, 최근 등록순) */
export async function getMyApps(): Promise<AppResponse[]> {
  const { data } = await api.get<AppResponse[]>('/apps/me')
  return data
}

export { api }
