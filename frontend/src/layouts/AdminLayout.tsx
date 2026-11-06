import { NavLink, Outlet } from 'react-router-dom'

export function AdminLayout() {
  const tabClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
      isActive
        ? 'bg-indigo-600 text-white'
        : 'text-slate-700 hover:bg-slate-200'
    }`

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h1 className="mb-3 text-lg font-bold text-slate-900">관리자(Admin) 메뉴</h1>
        <nav className="flex flex-wrap gap-2">
          <NavLink to="/admin/apps" className={tabClass}>
            앱 승인·반려·강제 삭제
          </NavLink>
          <NavLink to="/admin/users" className={tabClass}>
            유저 관리
          </NavLink>
          <NavLink to="/admin/verify" className={tabClass}>
            이상값 검증 대기
          </NavLink>
          <NavLink to="/admin/close" className={tabClass}>
            수동 마감·목데이터 토글
          </NavLink>
        </nav>
      </div>
      <div>
        <Outlet />
      </div>
    </div>
  )
}
