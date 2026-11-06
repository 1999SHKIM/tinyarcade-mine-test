import { createContext, useContext } from 'react'
import type { User, UserRole } from '../../types'

export interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean
  // [임시: 허 → 실제: 김] 10번 인증 작업 전까지 화면 개발용 임시 전환 함수
  switchMockRole: (role: UserRole | 'GUEST') => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
