import { useCallback, useEffect, useState } from 'react'
import { getRanking } from '../../api/ranking'
import { CommentSection } from '../../features/comments/CommentSection'
import type { OverallRankingEntry } from '../../types'

interface ToastItem {
  id: number
  message: string
  type: 'info' | 'success' | 'warn'
}

export function RankingPage() {
  const [tab, setTab] = useState<'WEEKLY' | 'TOTAL'>('WEEKLY')
  const [rankings, setRankings] = useState<OverallRankingEntry[]>([])
  const [periodKey, setPeriodKey] = useState<string | null>(null)
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const showToast = useCallback(
    (message: string, type: 'info' | 'success' | 'warn' = 'info') => {
      const id = Date.now() + Math.floor(Math.random() * 1000)
      setToasts((prev) => [...prev, { id, message, type }])
      setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== id))
      }, 3200)
    },
    [],
  )

  useEffect(() => {
    getRanking(tab === 'WEEKLY' ? 'WEEKLY' : 'ALL')
      .then((res) => {
        setRankings(res.entries)
        setPeriodKey(res.periodKey)
      })
      .catch(() => {
        setRankings([])
        setPeriodKey(null)
      })
  }, [tab])

  const topThree = rankings.slice(0, 3)

  return (
    <div className="space-y-5">
      {/* Ranking Header & Settled Notice Banner */}
      <section className="bg-white border border-warm-200 rounded-3xl p-5 sm:p-6 shadow-warm-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏆</span>
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-warm-900 tracking-tight">
                명예의 전당 (종합 유저 랭킹)
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-warm-500 mt-1">
              각 타이니앱의 주간 1위 달성 기록과 앱 인기도(참여자·추천수)를 종합 산출한 확정 랭킹입니다.
            </p>
          </div>

          {/* Weekly vs All-Time Tabs */}
          <div className="flex rounded-2xl bg-warm-100 p-1 border border-warm-200 text-xs font-bold shrink-0">
            <button
              type="button"
              onClick={() => setTab('WEEKLY')}
              className={`px-5 py-2.5 rounded-xl transition-all ${
                tab === 'WEEKLY'
                  ? 'bg-white text-warm-900 shadow-sm'
                  : 'text-warm-500 hover:text-warm-800'
              }`}
            >
              주간 확정 랭킹 {periodKey && tab === 'WEEKLY' ? `(${periodKey})` : ''}
            </button>
            <button
              type="button"
              onClick={() => setTab('TOTAL')}
              className={`px-5 py-2.5 rounded-xl transition-all ${
                tab === 'TOTAL'
                  ? 'bg-white text-warm-900 shadow-sm'
                  : 'text-warm-500 hover:text-warm-800'
              }`}
            >
              누적 종합 랭킹
            </button>
          </div>
        </div>

        {/* Settled Notice Banner */}
        <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2.5">
            <span className="text-base">📢</span>
            <div>
              <span className="font-bold">
                {tab === 'WEEKLY'
                  ? periodKey
                    ? `${periodKey} 주간 확정 랭킹`
                    : '주간 확정 랭킹'
                  : '시즌 1 전체 완료 주차 누적 포인트 합산 랭킹'}
              </span>
              <span className="text-amber-700 ml-2">
                • 매주 월요일 00:00 KST 마감 정산 완료
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-amber-800">
            <span className="px-2.5 py-0.5 rounded-md bg-white border border-amber-200">
              다음 마감: 월요일 00:00 KST
            </span>
          </div>
        </div>
      </section>

      {/* 2-COLUMN WIDE DASHBOARD (5 Cols TOP 3 Podium : 7 Cols Ranking Table & Cheer Comments) */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (5 Cols, Sticky): TOP 3 Podium ('으쓱 박제' UI) */}
        <section className="col-span-12 lg:col-span-5 space-y-4 lg:sticky lg:top-20">
          <div className="bg-white border border-warm-200 rounded-3xl p-5 sm:p-6 shadow-warm-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display font-black text-lg text-warm-900 tracking-tight">
                  👑 명예의 포디움 (TOP 3)
                </h2>
                <p className="text-xs text-warm-500 mt-0.5">
                  타이니앱의 정상에 오른 코더들의 영광스러운 박제 기록
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-mono font-bold text-[10px] border border-amber-200">
                으쓱 박제
              </span>
            </div>

            <div className="space-y-3.5">
              {topThree.length === 0 ? (
                <div className="p-8 text-center text-xs text-warm-500 font-bold">
                  집계된 포디움 데이터가 없습니다.
                </div>
              ) : (
                topThree.map((ranker) => {
                  if (ranker.rank === 1) {
                    return (
                      <div
                        key={ranker.userId}
                        className="bg-gradient-to-b from-amber-50 to-white border-2 border-amber-300 rounded-2xl p-5 space-y-3.5 shadow-podium relative"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-amber-400 border-2 border-white shadow-md flex items-center justify-center text-2xl">
                              👑
                            </div>
                            <div>
                              <div className="inline-block px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 font-mono font-black text-[10px]">
                                CHAMPION 1ST
                              </div>
                              <h3 className="font-display font-black text-lg text-amber-950 mt-0.5">
                                {ranker.nickname}
                              </h3>
                              {ranker.handle && (
                                <p className="text-[11px] text-amber-700 font-mono">{ranker.handle}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right font-mono">
                            <div className="text-[10px] text-amber-800 font-bold">종합 포인트</div>
                            <div className="text-xl font-black text-amber-900">
                              {ranker.totalPoints.toLocaleString()} pt
                            </div>
                          </div>
                        </div>

                        <div className="pt-2.5 border-t border-amber-200/80 space-y-1.5">
                          <div className="text-[11px] font-bold text-amber-800">
                            1위 달성 타이니앱 ({ranker.firstPlaceCount}개 독점!):
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {ranker.firstPlaceApps.map((appTitle) => (
                              <span
                                key={appTitle}
                                className="px-2.5 py-0.5 rounded-md bg-amber-200/80 text-amber-950 text-[10px] font-bold"
                              >
                                🏆 {appTitle}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  }

                  const isSecond = ranker.rank === 2
                  return (
                    <div
                      key={ranker.userId}
                      className={`bg-warm-50 border rounded-2xl p-4 space-y-2.5 ${
                        isSecond ? 'border-warm-300' : 'border-amber-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl border-2 border-white shadow-sm flex items-center justify-center text-xl ${
                              isSecond ? 'bg-warm-200' : 'bg-amber-700/20'
                            }`}
                          >
                            {isSecond ? '🥈' : '🥉'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-display font-extrabold text-sm text-warm-900">
                                {ranker.nickname}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-white text-warm-700 font-mono font-bold text-[10px] border border-warm-200">
                                {isSecond ? '2ND' : '3RD' }
                              </span>
                            </div>
                            {ranker.handle && (
                              <p className="text-[11px] text-warm-400 font-mono">{ranker.handle}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <div className="text-base font-black text-warm-900">
                            {ranker.totalPoints.toLocaleString()} pt
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-warm-200/70">
                        <span className="text-[10px] font-bold text-warm-400 mr-1">
                          1위 달성 ({ranker.firstPlaceCount}개):
                        </span>
                        {ranker.firstPlaceApps.map((appTitle) => (
                          <span
                            key={appTitle}
                            className="px-2 py-0.5 rounded-md bg-white border border-warm-200 text-warm-700 text-[10px] font-semibold"
                          >
                            {appTitle}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN (7 Cols): Full Ranking List + Ranking Cheer Comments */}
        <section className="col-span-12 lg:col-span-7 space-y-5">
          {/* Overall Rankings Table */}
          <div className="bg-white border border-warm-200 rounded-3xl p-5 sm:p-6 shadow-warm-card space-y-4">
            <div className="flex items-center justify-between border-b border-warm-200 pb-3">
              <div>
                <h2 className="font-display font-bold text-base sm:text-lg text-warm-900">
                  전체 종합 순위 보드
                </h2>
                <p className="text-xs text-warm-500 mt-0.5">
                  포디움(1~3위)부터 내 순위까지 스크롤 없이 한눈에 확인하세요.
                </p>
              </div>
              <span className="text-xs text-warm-400 font-mono">총 {rankings.length}명 참가 중</span>
            </div>

            <div className="space-y-2">
              {rankings.length === 0 ? (
                <div className="p-8 text-center text-xs text-warm-500 font-bold">
                  집계된 랭킹 데이터가 없습니다.
                </div>
              ) : (
                rankings.map((item) => {
                  if (item.isMe) {
                    return (
                      <div
                        key={item.userId}
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-rose-50 border-2 border-arcade-coral shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-arcade-coral text-white font-mono font-black text-sm flex items-center justify-center">
                            {item.rank}
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-sm text-arcade-coral">
                                {item.nickname}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-rose-100 text-arcade-coral text-[10px] font-bold">
                                MY
                              </span>
                            </div>
                            <div className="text-[11px] text-warm-500 font-mono">
                              1위 달성: {item.firstPlaceApps.join(', ')} {item.highlightNote ? `(${item.highlightNote})` : ''}
                            </div>
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <div className="text-base font-black text-arcade-coral">
                            {item.totalPoints.toLocaleString()} pt
                          </div>
                          {item.highlightNote && (
                            <div className="text-[10px] text-warm-500">{item.highlightNote}</div>
                          )}
                        </div>
                      </div>
                    )
                  }

                  const isTopThree = item.rank <= 3
                  return (
                    <div
                      key={item.userId}
                      className={`flex items-center justify-between p-3 rounded-2xl transition-colors ${
                        item.rank === 1
                          ? 'bg-amber-50/70 border border-amber-200'
                          : isTopThree
                            ? 'bg-warm-50 border border-warm-200'
                            : 'bg-warm-50/60 border border-warm-100 hover:bg-warm-100/70'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-8 h-8 rounded-full font-mono font-bold text-sm flex items-center justify-center ${
                            item.rank === 1
                              ? 'bg-amber-400 text-white font-black'
                              : item.rank === 2
                                ? 'bg-warm-200 text-warm-800 font-black'
                                : item.rank === 3
                                  ? 'bg-amber-700/20 text-amber-900 font-black'
                                  : 'bg-warm-100 text-warm-600'
                          }`}
                        >
                          {item.rank}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm text-warm-900">{item.nickname}</span>
                            {item.rank === 1 && <span className="text-xs">👑</span>}
                            {item.handle && (
                              <span className="text-[10px] text-warm-400 font-mono">{item.handle}</span>
                            )}
                          </div>
                          <div className="text-[11px] text-warm-500 font-mono">
                            1위 앱({item.firstPlaceCount}개): {item.firstPlaceApps.join(', ')}
                          </div>
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <div
                          className={`text-sm font-black ${
                            item.rank === 1 ? 'text-amber-800 text-base' : 'text-warm-900'
                          }`}
                        >
                          {item.totalPoints.toLocaleString()} pt
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Ranking Cheer & Community Comments (Shared CommentSection) */}
          <CommentSection targetType="RANKING" targetId={null} onNotify={showToast} />
        </section>
      </div>

      {/* Toast Notification Container */}
      <div className="fixed bottom-6 right-6 z-50 space-y-2 pointer-events-none">
        {toasts.map((toast) => {
          const borderStyle =
            toast.type === 'success'
              ? 'border-emerald-500'
              : toast.type === 'warn'
                ? 'border-amber-500'
                : 'border-arcade-coral'
          const icon =
            toast.type === 'success' ? '🎉' : toast.type === 'warn' ? '⚠️' : '⚡'
          return (
            <div
              key={toast.id}
              className={`px-3.5 py-2.5 rounded-2xl bg-white border-2 ${borderStyle} text-warm-900 shadow-xl text-xs font-bold flex items-center gap-2 pointer-events-auto`}
            >
              <span className="text-base">{icon}</span>
              <span>{toast.message}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
