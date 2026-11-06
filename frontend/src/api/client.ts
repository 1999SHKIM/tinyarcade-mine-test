import axios from 'axios'

/*
 * 모든 API 요청이 거쳐 가는 axios 인스턴스.
 *
 * [공부 포인트]
 * - baseURL '/api': 주소를 '/api'로 시작하게만 쓰면, 개발 중에는 Vite 프록시가, 배포에서는 Vercel rewrites가
 *   백엔드(Spring)로 넘겨 준다. 그래서 코드에 서버 주소를 적지 않아도 로컬·배포 모두 동작한다.
 * - 인터셉터(interceptor): 모든 요청·응답이 지나가는 "검문소". 여기 한 번만 적어 두면
 *   허의 게시판·마이페이지 요청에도 자동으로 토큰이 붙는다.
 */
const api = axios.create({ baseURL: '/api' })

// ── 로그인 토큰 (03_10_tinyarcade_auth §2: localStorage 'accessToken') ──
// localStorage: 브라우저에 문자열을 저장하는 공간. 새로고침하거나 창을 닫았다 열어도 남아 있다.
const TOKEN_KEY = 'accessToken'
/** 토큰이 서버에서 거부되어 지워졌을 때 AuthContext에 알리는 이벤트 이름 */
export const AUTH_EXPIRED_EVENT = 'auth:expired'

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

// [요청 검문소] 모든 요청에 "Authorization: Bearer 토큰" 헤더를 붙인다
// → 백엔드 JwtAuthenticationFilter가 이 헤더를 읽어 누구인지 판단한다
api.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// [응답 검문소] 토큰이 만료·위조(401)되었거나 정지·탈퇴 계정(403 USER_NOT_ACTIVE)이면 토큰을 지운다
// → 쓸모없는 토큰을 계속 보내지 않고, 화면도 로그아웃 상태로 바뀐다(이벤트로 AuthContext에 알림)
api.interceptors.response.use(
  (response) => response, // 성공 응답은 그대로 통과
  (error) => {
    const status = error.response?.status // ?. : 값이 없으면 오류 대신 undefined (옵셔널 체이닝)
    const code = error.response?.data?.code // 백엔드 공통 오류 형식 { code, message }의 code
    if (tokenStorage.get() && (status === 401 || (status === 403 && code === 'USER_NOT_ACTIVE'))) {
      tokenStorage.clear()
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT))
    }
    return Promise.reject(error) // 오류는 원래 호출한 곳(try-catch)으로 그대로 넘긴다
  },
)

/**
 * 공통 오류 형식 { code, message }에서 화면에 보여 줄 메시지를 꺼낸다.
 * 백엔드가 message에 한국어 안내문을 담아 주므로 프론트는 그대로 보여 주기만 하면 된다.
 */
export function getErrorMessage(error: unknown, fallback = '요청에 실패했습니다.'): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message
    if (typeof message === 'string') return message
  }
  return fallback // 서버가 꺼져 있는 등 응답 자체가 없을 때
}

export default api
