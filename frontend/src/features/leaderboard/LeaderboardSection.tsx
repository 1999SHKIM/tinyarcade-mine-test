import { useState } from 'react'
import { MOCK_ALLTIME_LEADERBOARD, MOCK_WEEKLY_LEADERBOARD } from '../../mocks'
import type { LeaderboardEntry } from '../../types'

interface LeaderboardSectionProps {
  weeklyEntries?: LeaderboardEntry[]
  allTimeEntries?: LeaderboardEntry[]
  myBestScore?: number
  myRankLabel?: string
  highlightMyRow?: boolean
  onStartPlay?: () => void
  onNotify?: (message: string, type?: 'info' | 'success' | 'warn') => void
}

// [허 담당] 명예의 전당 앱 리더보드 (주간·누적 탭, "검증 중..." 표시, 내 최고 기록, 빈 상태 토글)
export function LeaderboardSection({
  weeklyEntries = MOCK_WEEKLY_LEADERBOARD,
  allTimeEntries = MOCK_ALLTIME_LEADERBOARD,
  myBestScore = 1420,
  myRankLabel = '주간 4위',
  highlightMyRow = false,
  onStartPlay,
  onNotify,
}: LeaderboardSectionProps) {
  const [period, setPeriod] = useState<'WEEKLY' | 'ALL'>('WEEKLY')
  const [isEmptyState, setIsEmptyState] = useState(false)

  const entries = period === 'WEEKLY' ? weeklyEntries : allTimeEntries

  const handleTabChange = (next: 'WEEKLY' | 'ALL') => {
    setPeriod(next)
    onNotify?.(
      next === 'WEEKLY'
        ? '주간 리더보드 (2026-W45 주차)를 조회합니다.'
        : '누적 전체 리더보드를 조회합니다.',
      'info',
    )
  }

  return (
    <div className="bg-white border border-warm-200 rounded-3xl p-5 sm:p-6 shadow-warm-card space-y-4">
      {/* Card Header & Weekly / All-time Tabs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏆</span>
            <div>
              <h2 className="font-display font-extrabold text-base sm:text-lg text-warm-900 tracking-tight">
                명예의 전당
              </h2>
              <div className="text-[10px] text-warm-400 font-mono">
                앱별 단독 원점수 리더보드
              </div>
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
            실시간 갱신
          </span>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex rounded-2xl bg-warm-100 p-1 border border-warm-200 text-xs font-bold w-full max-w-[220px]">
            <button
              type="button"
              onClick={() => handleTabChange('WEEKLY')}
              className={`flex-1 py-1.5 rounded-xl transition-all ${
                period === 'WEEKLY'
                  ? 'bg-white text-warm-900 shadow-sm'
                  : 'text-warm-500 hover:text-warm-800'
              }`}
            >
              주간 랭킹
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('ALL')}
              className={`flex-1 py-1.5 rounded-xl transition-all ${
                period === 'ALL'
                  ? 'bg-white text-warm-900 shadow-sm'
                  : 'text-warm-500 hover:text-warm-800'
              }`}
            >
              누적 랭킹
            </button>
          </div>

          {/* Prototype Empty Toggle */}
          <button
            type="button"
            onClick={() => setIsEmptyState((prev) => !prev)}
            className="text-[11px] font-medium text-warm-400 hover:text-warm-700 underline decoration-dotted shrink-0"
          >
            {isEmptyState ? '[정상 랭킹 보기]' : '[빈 상태]'}
          </button>
        </div>

        <div className="flex items-center justify-between text-[11px] text-warm-400 font-medium">
          <span>매주 월요일 00:00 KST 집계</span>
          <span>1인 다수 순위 가능</span>
        </div>
      </div>

      {/* My Best Score Sticky Box */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50/60 border border-amber-200/80 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-400 text-white flex items-center justify-center font-bold text-xs shadow-sm">
            ★
          </div>
          <div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-amber-700 font-mono">
              내 최고 기록
            </div>
            <div className="text-xs font-bold text-warm-800">코딩꿈나무 (나)</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-base font-mono font-black text-warm-900">
            {myBestScore.toLocaleString()}점
          </div>
          <div className="text-[11px] font-bold text-arcade-coral">{myRankLabel}</div>
        </div>
      </div>

      {/* Leaderboard Rows or Empty State */}
      {!isEmptyState ? (
        <div className="space-y-1.5">
          {entries.map((entry) => {
            const isWithdrawn = entry.userStatus === 'WITHDRAWN'

            // Rank 1: Gold Card
            if (entry.rank === 1) {
              return (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-amber-50/80 border border-amber-200 shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-amber-400 text-white font-black text-xs flex items-center justify-center shadow-sm">
                      1
                    </span>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-xs sm:text-sm text-warm-900">
                          {isWithdrawn ? '탈퇴한 유저' : entry.nickname}
                        </span>
                        <span className="text-xs">👑</span>
                        {entry.verifyStatus === 'PENDING' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold border border-amber-200">
                            검증 중...
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-warm-400 font-mono">
                        {entry.submittedAt}
                      </div>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-sm sm:text-base font-black text-amber-800">
                      {entry.score.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-amber-700">점</span>
                  </div>
                </div>
              )
            }

            // Current User Row (isMe)
            if (entry.isMe) {
              return (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between p-2.5 rounded-2xl bg-rose-50/70 border-2 border-arcade-coral shadow-sm ${
                    highlightMyRow ? 'flash-target' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-arcade-coral text-white font-black text-xs flex items-center justify-center">
                      {entry.rank}
                    </span>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-xs text-arcade-coral">
                          {entry.nickname}
                        </span>
                        <span className="text-[9px] px-1 py-0.5 rounded bg-rose-100 text-arcade-coral font-bold">
                          MY
                        </span>
                      </div>
                      <div className="text-[10px] text-warm-400 font-mono">
                        {entry.submittedAt}
                      </div>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-sm font-black text-arcade-coral">
                      {myBestScore.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-arcade-coral">점</span>
                  </div>
                </div>
              )
            }

            // Rank 2 & 3 Cards
            if (entry.rank === 2 || entry.rank === 3) {
              return (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-warm-50 border border-warm-200"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-6 h-6 rounded-full font-black text-xs flex items-center justify-center ${
                        entry.rank === 2
                          ? 'bg-warm-200 text-warm-700'
                          : 'bg-amber-700/20 text-amber-900'
                      }`}
                    >
                      {entry.rank}
                    </span>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-xs text-warm-800">
                          {isWithdrawn ? '탈퇴한 유저' : entry.nickname}
                        </span>
                        {entry.verifyStatus === 'PENDING' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold border border-amber-200">
                            검증 중...
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-warm-400 font-mono">
                        {entry.submittedAt}
                      </div>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-sm font-bold text-warm-900">
                      {entry.score.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-warm-500">점</span>
                  </div>
                </div>
              )
            }

            // Rank 5+: Compact Row (Withdrawn vs Active)
            return (
              <div
                key={entry.id}
                className={`flex items-center justify-between p-2 rounded-2xl hover:bg-warm-100/60 text-xs transition-colors ${
                  isWithdrawn ? 'text-warm-400' : 'text-warm-500'
                }`}
              >
                <div className="flex items-center gap-2.5 font-mono">
                  <span className="w-6 text-center font-bold">{entry.rank}</span>
                  <span
                    className={`font-sans font-medium text-xs ${
                      isWithdrawn ? 'text-warm-400' : 'text-warm-700'
                    }`}
                  >
                    {isWithdrawn ? '탈퇴한 유저' : entry.nickname}
                  </span>
                  {entry.verifyStatus === 'PENDING' && (
                    <span className="font-sans text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold border border-amber-200">
                      검증 중...
                    </span>
                  )}
                </div>
                <span
                  className={`font-mono text-xs ${
                    isWithdrawn ? 'text-warm-400' : 'text-warm-900 font-bold'
                  }`}
                >
                  {entry.score.toLocaleString()}점
                </span>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-warm-50 border-2 border-dashed border-warm-200 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 text-xl flex items-center justify-center">
            🏆
          </div>
          <div className="space-y-1">
            <h4 className="font-display font-bold text-warm-800 text-sm">
              아직 등록된 기록이 없습니다!
            </h4>
            <p className="text-[11px] text-warm-500 leading-relaxed">
              지금 첫 번째 플레이어가 되어 이번 주 1등에 박제해보세요!
            </p>
          </div>
          <button
            type="button"
            onClick={onStartPlay}
            className="px-4 py-2 rounded-xl bg-arcade-coral text-white font-bold text-xs shadow-md hover:bg-arcade-coralHover active:scale-95 transition-all"
          >
            지금 바로 첫 플레이하기 🎮
          </button>
        </div>
      )}

      {/* Leaderboard Info Footer */}
      <div className="pt-2 border-t border-warm-100 text-[11px] text-warm-500 leading-relaxed">
        💡 주간 1등 유저는 매주 월요일 00:00 마감 시 종합 랭킹 포인트가 합산됩니다.
      </div>
    </div>
  )
}
