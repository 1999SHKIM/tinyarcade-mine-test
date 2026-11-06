import { useState } from 'react'
import { Badge, Tabs } from '../../components'

// [허 담당] 앱 리더보드 (주간·누적 탭, "검증 중..." 표시)
export function LeaderboardSection() {
  const [period, setPeriod] = useState<'WEEKLY' | 'ALL'>('WEEKLY')

  return (
    <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">앱 리더보드</h3>
        <Badge tone="warning">검증 중... 표시 지원</Badge>
      </div>
      <Tabs
        tabs={[
          { key: 'WEEKLY', label: '주간 리더보드' },
          { key: 'ALL', label: '누적 리더보드' },
        ]}
        activeKey={period}
        onChange={setPeriod}
      />
      <p className="text-sm text-slate-600">
        {period === 'WEEKLY' ? '주간' : '누적'} 원점수 순위표 영역
      </p>
    </section>
  )
}
