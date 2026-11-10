import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth'

export function AdminLayout() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto py-16 text-center text-xs font-bold text-warm-500">
        불러오는 중...
      </div>
    )
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="max-w-2xl mx-auto pt-6 space-y-5">
        <div className="bg-white border border-warm-200 rounded-3xl p-8 text-center space-y-4 shadow-warm-card">
          <div className="text-3xl">🛡️</div>
          <h1 className="font-display font-extrabold text-lg text-warm-900">
            관리자 권한이 필요합니다
          </h1>
          <p className="text-xs text-warm-500">
            이 화면은 관리자 계정으로 로그인했을 때만 이용할 수 있습니다.
          </p>
          <div className="pt-2 flex justify-center gap-2.5">
            <Link
              to="/"
              className="px-5 py-2.5 rounded-xl bg-warm-100 hover:bg-warm-200 text-xs font-bold text-warm-700 transition-colors"
            >
              홈으로 돌아가기
            </Link>
            {!isAuthenticated && (
              <Link
                to="/login"
                className="px-5 py-2.5 rounded-xl bg-arcade-coral hover:bg-arcade-coralHover text-white text-xs font-bold shadow-btn-play transition-all"
              >
                로그인
              </Link>
            )}
          </div>
        </div>
      </div>
    )
  }

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
      isActive
        ? 'bg-arcade-coral text-white shadow-xs'
        : 'text-warm-700 hover:bg-warm-100 hover:text-warm-900'
    }`

  return (
    <div className="grid grid-cols-12 gap-5 sm:gap-6 items-start pt-2">
      {/* 왼쪽 관리자 메뉴 (AdminLayout) */}
      <aside className="col-span-12 md:col-span-3 bg-white border border-warm-200 rounded-3xl p-5 shadow-warm-card space-y-4">
        <div className="border-b border-warm-200 pb-3">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
            ADMIN CONSOLE
          </span>
          <h1 className="font-display font-extrabold text-base text-warm-900 mt-1.5">
            관리자 메뉴
          </h1>
        </div>

        <nav className="flex flex-row md:flex-col gap-1.5 flex-wrap">
          <NavLink to="/admin/apps" className={navClass}>
            <span>앱 관리</span>
          </NavLink>
          <NavLink to="/admin/users" className={navClass}>
            <span>유저 관리</span>
          </NavLink>
          <NavLink to="/admin/verify" className={navClass}>
            <span>이상값 검증 대기</span>
          </NavLink>
          <NavLink to="/admin/close" className={navClass}>
            <span>수동 마감·목데이터</span>
          </NavLink>
        </nav>
      </aside>

      {/* 오른쪽 본문 영역 */}
      <div className="col-span-12 md:col-span-9 min-w-0">
        <Outlet />
      </div>
    </div>
  )
}
