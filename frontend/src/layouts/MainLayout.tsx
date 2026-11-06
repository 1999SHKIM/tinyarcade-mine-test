import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth'

export function MainLayout() {
  const { user, isAuthenticated, isAdmin, switchMockRole } = useAuth()

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors ${
      isActive ? 'text-indigo-600' : 'text-slate-600 hover:text-slate-900'
    }`

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* 개발용 임시 로그인 상태 전환 바 (10번 실제 인증 연결 후 제거) */}
      <div className="bg-slate-900 px-4 py-1.5 text-xs text-slate-200">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <span>
            [임시 Auth] 현재 상태:{' '}
            <strong>
              {user ? `${user.nickname} (${user.role})` : '비로그인 (GUEST)'}
            </strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => switchMockRole('GUEST')}
              className={`rounded px-2 py-0.5 ${
                !user ? 'bg-indigo-600 text-white' : 'bg-slate-700 hover:bg-slate-600'
              }`}
            >
              비로그인
            </button>
            <button
              type="button"
              onClick={() => switchMockRole('USER')}
              className={`rounded px-2 py-0.5 ${
                user?.role === 'USER'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-700 hover:bg-slate-600'
              }`}
            >
              일반유저(USER)
            </button>
            <button
              type="button"
              onClick={() => switchMockRole('ADMIN')}
              className={`rounded px-2 py-0.5 ${
                user?.role === 'ADMIN'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-700 hover:bg-slate-600'
              }`}
            >
              관리자(ADMIN)
            </button>
          </div>
        </div>
      </div>

      {/* GNB */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-bold tracking-tight text-indigo-600">
              TinyArcade
            </Link>
            <nav className="flex items-center gap-6">
              <NavLink to="/apps" className={navLinkClass}>
                앱 목록
              </NavLink>
              <NavLink to="/ranking" className={navLinkClass}>
                유저 랭킹
              </NavLink>
              <NavLink to="/board" className={navLinkClass}>
                게시판
              </NavLink>
              <NavLink to="/guide" className={navLinkClass}>
                따라해보세요
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated && (
              <NavLink to="/apps/register" className={navLinkClass}>
                앱 등록
              </NavLink>
            )}
            {isAdmin && (
              <NavLink
                to="/admin/apps"
                className="rounded-md bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-200"
              >
                관리 메뉴
              </NavLink>
            )}
            {isAuthenticated ? (
              <NavLink to="/mypage" className={navLinkClass}>
                마이페이지 ({user?.nickname})
              </NavLink>
            ) : (
              <div className="flex items-center gap-3">
                <NavLink to="/login" className={navLinkClass}>
                  로그인
                </NavLink>
                <NavLink
                  to="/signup"
                  className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  회원가입
                </NavLink>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 본문 */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
