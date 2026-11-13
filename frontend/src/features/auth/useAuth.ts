import { createContext, useContext } from 'react'
import type { User } from '../../types'

export interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean
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
