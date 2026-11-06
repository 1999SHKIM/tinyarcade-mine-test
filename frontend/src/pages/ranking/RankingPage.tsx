import { useState } from 'react'
import { Tabs } from '../../components'
import { CommentSection } from '../../features/comments/CommentSection'

export function RankingPage() {
  const [tab, setTab] = useState<'WEEKLY' | 'TOTAL'>('WEEKLY')

  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-bold">종합 유저 랭킹 (RankingPage)</h1>
        <Tabs
          tabs={[
            { key: 'WEEKLY', label: '주간 확정 랭킹' },
            { key: 'TOTAL', label: '누적 종합 랭킹' },
          ]}
          activeKey={tab}
          onChange={setTab}
        />
        <p className="text-sm text-slate-600">
          {tab === 'WEEKLY'
            ? '가장 최근 정상 완료된 주차의 확정 1등 포인트 합산 순위 및 으쓱 박제 UI'
            : '모든 정상 완료·확정 주차의 포인트 단순 합산 누적 순위'}
        </p>
      </div>

      <CommentSection targetType="RANKING" targetId={null} />
    </div>
  )
}
