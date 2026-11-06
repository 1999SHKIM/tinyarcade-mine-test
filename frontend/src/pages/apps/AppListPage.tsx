import { Link } from 'react-router-dom'
import { Badge } from '../../components'

export function AppListPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">타이니앱 목록 (AppListPage)</h1>
        <Link
          to="/apps/register"
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          타이니앱 등록하기
        </Link>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="mb-2 flex items-center gap-2">
          <Badge tone="official">공식 앱</Badge>
          <Badge tone="user">유저 앱</Badge>
        </div>
        <p className="text-sm text-slate-600">
          승인된(APPROVED) 앱 목록 추천순 정렬 표시 영역.{' '}
          <Link to="/apps/1" className="font-medium text-indigo-600 underline">
            샘플 앱 상세(#1) 이동 테스트
          </Link>
        </p>
      </div>
    </div>
  )
}
