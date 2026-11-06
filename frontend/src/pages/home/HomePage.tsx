import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/client'
import { Badge } from '../../components'

export function HomePage() {
  const [health, setHealth] = useState('확인 중...')

  useEffect(() => {
    api
      .get<string>('/health')
      .then((res) => setHealth(res.data))
      .catch(() => setHealth('backend 연결 실패'))
  }, [])

  return (
    <div className="space-y-8">
      <section className="rounded-xl bg-indigo-600 p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">나만의 개발학습 플랫폼, TinyArcade</h1>
            <p className="mt-2 text-sm text-indigo-100">
              타이니앱 오락실 + 커뮤니티 (메인 페이지: HomePage)
            </p>
          </div>
          <span className="rounded-full bg-indigo-500 px-3 py-1 text-xs">
            API 상태: {health}
          </span>
        </div>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold">공식 코딩학습 타이니앱</h2>
            <Badge tone="official">공식 앱</Badge>
          </div>
          <Link to="/apps" className="text-sm text-indigo-600 hover:underline">
            전체 앱 보기 →
          </Link>
        </div>
        <p className="text-sm text-slate-600">
          공식 앱 강조 영역 및 추천순 앱 목록 표시 자리
        </p>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">주간 확정 유저 랭킹 TOP</h2>
          <Link to="/ranking" className="text-sm text-indigo-600 hover:underline">
            전체 랭킹 보기 →
          </Link>
        </div>
        <p className="text-sm text-slate-600">
          최근 정상 완료된 주차의 공개 확정 유저 랭킹 상위 표시 자리
        </p>
      </section>
    </div>
  )
}
