import { useCallback, useEffect, useState, type ReactNode } from 'react'
import * as authApi from '../../api/auth'
import { AUTH_EXPIRED_EVENT, tokenStorage } from '../../api/client'
import type { User, UserRole } from '../../types'
import { AuthContext } from './useAuth'

// [허] 화면 개발용 목 유저. 개발 모드에서 GNB 전환 버튼으로만 사용 (03_10_tinyarcade_auth §4-2)
const MOCK_USERS: Record<UserRole, User> = {
  USER: {
    id: 1,
    email: 'player@tinyarcade.com',
    nickname: '타이니플레이어',
    role: 'USER',
    status: 'ACTIVE',
  },
  ADMIN: {
    id: 999,
    email: 'admin@tinyarcade.com',
    nickname: '관리자허',
    role: 'ADMIN',
    status: 'ACTIVE',
  },
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // [김] 기본값: 실제 로그인 상태. 토큰이 있으면 /users/me로 복원한다
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(() => tokenStorage.get() !== null)

  useEffect(() => {
    if (!tokenStorage.get()) return
    authApi
      .getMe()
      .then(setUser)
      .catch(() => {
        tokenStorage.clear()
        setUser(null)
      })
      .finally(() => setIsLoading(false))
  }, [])

  // 다른 요청에서 토큰이 거부되면(만료·정지) 로그아웃 상태로 바꾼다
  useEffect(() => {
    const onExpired = () => setUser(null)
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password)
    tokenStorage.set(res.accessToken)
    // 로그인은 ACTIVE 유저만 성공한다
    setUser({ ...res.user, status: 'ACTIVE' })
  }, [])

  const logout = useCallback(() => {
    tokenStorage.clear()
    setUser(null)
  }, [])

  // [허 → 김] 목 전환은 개발 모드에서만 화면 표시를 바꾼다. 서버 요청에는 실제 토큰이 쓰인다
  const switchMockRole = useCallback((role: UserRole | 'GUEST') => {
    if (!import.meta.env.DEV) return
    setUser(role === 'GUEST' ? null : MOCK_USERS[role])
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isAdmin: user?.role === 'ADMIN',
        switchMockRole,
        logout,
        login,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
