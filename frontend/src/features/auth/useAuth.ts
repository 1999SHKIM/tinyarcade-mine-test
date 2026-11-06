import { createContext, useContext } from 'react'
import type { User, UserRole } from '../../types'

export interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean
  // [임시: 허 → 실제: 김] 10번 인증 작업 전까지 화면 개발용 임시 전환 함수
  // 10번 이후: 개발 모드(npm run dev)에서만 동작, 배포에서는 아무 일도 하지 않음 (03_10_tinyarcade_auth §4-2)
  switchMockRole: (role: UserRole | 'GUEST') => void
  logout: () => void
  // [김] 10번 인증: 로그인(토큰 저장 + user 설정), 새로고침 시 로그인 복원 중 여부
  login: (email: string, password: string) => Promise<void>
  isLoading: boolean
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
