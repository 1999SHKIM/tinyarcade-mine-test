import { useCallback, useEffect, useState, type ReactNode } from 'react'
import * as authApi from '../../api/auth'
import { AUTH_EXPIRED_EVENT, tokenStorage } from '../../api/client'
import type { User } from '../../types'
import { AuthContext } from './useAuth'

/*
 * 로그인 상태를 앱 전체에 나눠 주는 공급자(Provider).
 *
 * [공부 포인트: React Context]
 * - main.tsx에서 <AuthProvider>가 <App>을 감싸고 있다. 그래서 어느 화면에서든 useAuth()를 부르면
 *   여기의 user, login, logout을 꺼내 쓸 수 있다. (화면마다 props로 내려 주지 않아도 됨)
 * - user가 바뀌면 useAuth()를 쓰는 화면(예: 허의 GNB)이 자동으로 다시 그려진다.
 *
 * [로그인 상태의 흐름]
 * 1) 로그인: login() → 서버에서 토큰 받기 → localStorage에 저장 → user 설정 → GNB에 닉네임 표시
 * 2) 새로고침: React 상태(user)는 사라지지만 localStorage의 토큰은 남아 있다 → /users/me로 user 복원
 * 3) 로그아웃: 토큰 삭제 + user = null
 */

export function AuthProvider({ children }: { children: ReactNode }) {
  // [김] 기본값: 실제 로그인 상태(처음엔 비로그인). 토큰이 있으면 아래 useEffect가 /users/me로 복원한다
  const [user, setUser] = useState<User | null>(null)
  // 토큰이 있으면 "복원 중"으로 시작한다. 화면이 잠깐 비로그인으로 깜빡이는 것을 막는 데 쓸 수 있다
  // (useState에 함수를 넘기면 첫 렌더링 때 한 번만 실행된다)
  const [isLoading, setIsLoading] = useState<boolean>(() => tokenStorage.get() !== null)

  // useEffect(..., []): 화면이 처음 나타날 때 한 번만 실행 → 새로고침 시 로그인 복원
  useEffect(() => {
    if (!tokenStorage.get()) return
    authApi
      .getMe()
      .then(setUser) // 성공: 서버가 알려 준 내 정보로 user 설정
      .catch(() => {
        // 실패(만료·정지 등): 토큰을 버리고 비로그인으로
        tokenStorage.clear()
        setUser(null)
      })
      .finally(() => setIsLoading(false))
  }, [])

  // 다른 요청에서 토큰이 거부되면(만료·정지) client.ts가 이벤트를 보낸다 → 로그아웃 상태로 바꾼다
  // return의 함수는 "정리(cleanup)": 컴포넌트가 사라질 때 이벤트 구독을 해제한다
  useEffect(() => {
    const onExpired = () => setUser(null)
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired)
  }, [])

  // useCallback: 함수를 매 렌더링마다 새로 만들지 않고 재사용한다 (불필요한 다시 그리기 방지)
  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password) // 실패하면 예외 → LoginPage의 catch로
    tokenStorage.set(res.accessToken)
    // 로그인은 ACTIVE 유저만 성공하므로 status를 ACTIVE로 채운다 (로그인 응답에는 status가 없음)
    setUser({ ...res.user, status: 'ACTIVE' })
  }, [])

  const logout = useCallback(() => {
    tokenStorage.clear() // JWT 방식은 서버가 로그인 상태를 기억하지 않으므로, 토큰만 지우면 로그아웃이다
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isAdmin: user?.role === 'ADMIN',
        logout,
        login,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
