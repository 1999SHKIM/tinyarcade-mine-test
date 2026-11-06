import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth'

export function MainLayout() {
  const { user, isAuthenticated, isAdmin, switchMockRole, logout } = useAuth()

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3.5 py-1.5 rounded-xl text-xs sm:text-sm transition-colors ${
      isActive
        ? 'text-arcade-coral bg-rose-50 font-bold'
        : 'text-warm-600 font-semibold hover:text-warm-900 hover:bg-warm-100'
    }`

  return (
    <div className="min-h-screen bg-warm-50 text-warm-800 flex flex-col font-sans antialiased">
      {/* 개발용 임시 로그인 상태 전환 바 (10번 실제 인증 연결 후 제거) */}
      <div className="bg-warm-900 px-4 py-1.5 text-xs text-warm-200">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-2">
          <span>
            [임시 Auth] 현재 상태:{' '}
            <strong className="text-white">
              {user ? `${user.nickname} (${user.role})` : '비로그인 (GUEST)'}
            </strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => switchMockRole('GUEST')}
              className={`rounded-lg px-2.5 py-0.5 font-semibold transition-colors ${
                !user
                  ? 'bg-arcade-coral text-white'
                  : 'bg-warm-800 text-warm-300 hover:bg-warm-700'
              }`}
            >
              비로그인
            </button>
            <button
              type="button"
              onClick={() => switchMockRole('USER')}
              className={`rounded-lg px-2.5 py-0.5 font-semibold transition-colors ${
                user?.role === 'USER'
                  ? 'bg-arcade-coral text-white'
                  : 'bg-warm-800 text-warm-300 hover:bg-warm-700'
              }`}
            >
              일반유저(USER)
            </button>
            <button
              type="button"
              onClick={() => switchMockRole('ADMIN')}
              className={`rounded-lg px-2.5 py-0.5 font-semibold transition-colors ${
                user?.role === 'ADMIN'
                  ? 'bg-arcade-coral text-white'
                  : 'bg-warm-800 text-warm-300 hover:bg-warm-700'
              }`}
            >
              관리자(ADMIN)
            </button>
          </div>
        </div>
      </div>

      {/* GNB (Global Navigation Bar) - PC Wide Header */}
      <header className="bg-white border-b border-warm-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand Logo & Global Nav */}
          <div className="flex items-center gap-6 sm:gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-arcade-coral to-amber-400 flex items-center justify-center text-white font-black text-xl shadow-md transform group-hover:scale-105 transition-transform">
                🎮
              </div>
              <div>
                <span className="font-display font-extrabold text-xl tracking-tight text-warm-900 group-hover:text-arcade-coral transition-colors">
                  Tiny<span className="text-arcade-coral">Arcade</span>
                </span>
                <span className="ml-2 px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-full bg-warm-100 text-warm-600 border border-warm-200">
                  오락실
                </span>
              </div>
            </Link>

            {/* Menu Tabs (Desktop Wide Nav) */}
            <nav className="flex items-center gap-1">
              <NavLink to="/apps" className={navLinkClass}>
                앱 목록
              </NavLink>
              <NavLink to="/ranking" className={navLinkClass}>
                종합 랭킹
              </NavLink>
              <NavLink to="/board" className={navLinkClass}>
                커뮤니티
              </NavLink>
              <NavLink to="/guide" className={navLinkClass}>
                따라해보세요
              </NavLink>
            </nav>
          </div>

          {/* Right Auth Area */}
          <div className="flex items-center gap-3">
            {/* Current Season Badge */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-warm-100 border border-warm-200 text-xs font-medium text-warm-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono font-semibold">2026-W45 주차 진행 중</span>
            </div>

            {isAuthenticated && (
              <NavLink
                to="/apps/register"
                className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-warm-100 hover:bg-warm-200 text-warm-800 text-xs font-bold transition-colors"
              >
                + 앱 등록
              </NavLink>
            )}

            {isAdmin && (
              <NavLink
                to="/admin/apps"
                className="rounded-xl bg-amber-100 border border-amber-200 px-3 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-200 transition-colors"
              >
                관리 메뉴
              </NavLink>
            )}

            {/* User Profile Pill / Guest Buttons */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2.5 pl-3 border-l border-warm-200">
                <Link
                  to="/mypage"
                  className="flex items-center gap-2.5 group"
                  title="마이페이지로 이동"
                >
                  <div className="w-8 h-8 rounded-full bg-warm-200 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center font-bold text-sm text-warm-700">
                    🧑‍💻
                  </div>
                  <div className="text-left text-xs leading-tight">
                    <div className="font-bold text-warm-900 group-hover:text-arcade-coral transition-colors">
                      {user?.nickname}
                    </div>
                    <div className="text-[10px] text-warm-500 font-mono">1,420점 (4위)</div>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="ml-1 text-xs font-semibold text-warm-400 hover:text-warm-700 px-2 py-1 rounded-lg hover:bg-warm-100 transition-colors"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-3 border-l border-warm-200">
                <NavLink
                  to="/login"
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-warm-700 hover:bg-warm-100 transition-colors"
                >
                  로그인
                </NavLink>
                <NavLink
                  to="/signup"
                  className="px-3.5 py-1.5 rounded-xl bg-arcade-coral hover:bg-arcade-coralHover text-xs font-bold text-white shadow-sm transition-colors"
                >
                  회원가입
                </NavLink>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 본문 */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-4 pb-16 flex-1 w-full">
        <Outlet />
      </main>
    </div>
  )
}
