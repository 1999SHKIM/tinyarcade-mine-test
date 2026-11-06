import { useState, type ReactNode } from 'react'
import type { User, UserRole } from '../../types'
import { AuthContext } from './useAuth'

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
  // 기본값: 임시 일반 유저 (GNB에서 비로그인/일반유저/관리자로 즉시 전환 가능)
  const [user, setUser] = useState<User | null>(MOCK_USERS.USER)

  const switchMockRole = (role: UserRole | 'GUEST') => {
    if (role === 'GUEST') {
      setUser(null)
    } else {
      setUser(MOCK_USERS[role])
    }
  }

  const logout = () => setUser(null)

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isAdmin: user?.role === 'ADMIN',
        switchMockRole,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
