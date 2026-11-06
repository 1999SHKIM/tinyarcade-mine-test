import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

// ── 로그인 토큰 (03_10_tinyarcade_auth §2: localStorage 'accessToken') ──
const TOKEN_KEY = 'accessToken'
/** 토큰이 서버에서 거부되어 지워졌을 때 AuthContext에 알리는 이벤트 */
export const AUTH_EXPIRED_EVENT = 'auth:expired'

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

// 모든 요청에 토큰을 붙인다
api.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 토큰이 만료·위조(401)되었거나 정지·탈퇴 계정(403 USER_NOT_ACTIVE)이면 토큰을 지운다
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const code = error.response?.data?.code
    if (tokenStorage.get() && (status === 401 || (status === 403 && code === 'USER_NOT_ACTIVE'))) {
      tokenStorage.clear()
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT))
    }
    return Promise.reject(error)
  },
)

/** 공통 오류 형식 { code, message }에서 화면에 보여 줄 메시지를 꺼낸다 */
export function getErrorMessage(error: unknown, fallback = '요청에 실패했습니다.'): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message
    if (typeof message === 'string') return message
  }
  return fallback
}

export default api
