import { Link } from 'react-router-dom'

export function AppRegisterPage() {
  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">타이니앱 등록 (AppRegisterPage)</h1>
        <Link to="/guide" className="text-sm text-indigo-600 hover:underline">
          따라해보세요 가이드 보기 →
        </Link>
      </div>
      <p className="text-sm text-slate-600">
        깃허브 레포 URL, 진입 HTML 경로, 앱 제목·설명, 선택적 최대 점수(max_score) 등록 및 미리보기 링크 발급 화면
      </p>
    </div>
  )
}
