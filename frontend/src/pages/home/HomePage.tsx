import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getApps, type AppResponse } from '../../api/apps'
import api from '../../api/client'
import { getRanking } from '../../api/ranking'
import { AppThumbnail } from '../../features/apps/AppThumbnail'
import { MaintenanceAppCard } from '../../features/apps/MaintenanceAppCard'
import { MAINTENANCE_APPS } from '../../features/apps/maintenanceApps'
import { PlayModal } from '../../features/player/PlayModal'
import type { OverallRankingEntry } from '../../types'

interface ToastItem {
  id: number
  message: string
  type: 'info' | 'success' | 'warn'
}

type HeroMode = 'OFFICIAL' | 'WEEKLY_HOT'

export function HomePage() {
  const navigate = useNavigate()
  const [health, setHealth] = useState<'ok' | 'loading' | 'error'>('loading')
  const [apps, setApps] = useState<AppResponse[]>([])
  const [weeklyRanking, setWeeklyRanking] = useState<OverallRankingEntry[]>([])

  // F5(리로드) 시마다 📌 공식 대표 학습 앱 또는 🔥 이번 주 참여 1위 핫 앱 랜덤 선택
  const [heroMode] = useState<HeroMode>(() =>
    Math.random() < 0.5 ? 'OFFICIAL' : 'WEEKLY_HOT',
  )

  const [playingApp, setPlayingApp] = useState<AppResponse | null>(null)
  const [modalSessionId, setModalSessionId] = useState(0)
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
    api
      .get<string>('/health')
      .then((res) => setHealth(res.data === 'ok' ? 'ok' : 'error'))
      .catch(() => setHealth('error'))

    getApps()
      .then(setApps)
      .catch(() => setApps([]))

    getRanking('WEEKLY')
      .then((res) => setWeeklyRanking(res.entries))
      .catch(() => setWeeklyRanking([]))
  }, [])

  const officialApps = apps.filter((app) => app.isOfficial)
  const userApps = apps.filter((app) => !app.isOfficial)

  // 히어로에 노출할 대표 앱 (모드에 따라 선정)
  const hotApp = apps.reduce<AppResponse | undefined>(
    (best, app) => ((app.weeklyParticipants ?? 0) > (best?.weeklyParticipants ?? 0) ? app : best),
    undefined,
  )
  const showOfficial = heroMode === 'OFFICIAL' || hotApp === undefined
  const featuredApp = (showOfficial ? officialApps[0] : hotApp) ?? apps[0]

  const openQuickPlay = (app: AppResponse) => {
    setModalSessionId((prev) => prev + 1)
    setPlayingApp(app)
    showToast(`${app.title} 게임 세션 시작 (16:10 / 800×500 px)`, 'info')
  }

  if (!featuredApp) {
    return (
      <div className="bg-white border border-warm-200 rounded-3xl p-10 text-center text-warm-500 shadow-warm-card">
        등록된 앱이 없습니다.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* COMPACT HERO BANNER SECTION */}
      <section className="relative bg-white border border-warm-200 rounded-3xl p-5 sm:p-7 shadow-warm-card overflow-hidden">
        <div className="grid grid-cols-12 gap-6 items-center">
          {/* Left Hero Copy & Action (7 Cols) */}
          <div className="col-span-12 lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-warm-100 border border-warm-200 text-xs font-bold text-warm-700">
                <span className="w-2 h-2 rounded-full bg-arcade-coral animate-ping" />
                <span>바이브코딩으로 만든 웹 아케이드의 세계</span>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold border ${
                  health === 'ok'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-warm-100 text-warm-500 border-warm-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    health === 'ok' ? 'bg-emerald-500' : 'bg-warm-400'
                  }`}
                />
                API: {health === 'ok' ? '정상 연결' : health === 'loading' ? '확인 중' : '오프라인'}
              </span>
            </div>

            <h1 className="font-display font-extrabold text-2xl sm:text-4xl text-warm-900 tracking-tight leading-tight">
              코딩 학습과 웹 게임을
              <br />
              <span className="text-arcade-coral">가장 가볍고 즐겁게</span> 즐기세요.
            </h1>

            <p className="text-xs sm:text-sm text-warm-600 leading-relaxed max-w-xl">
              TinyArcade는 가벼운 16:10 웹 게임을 누구나 쉽게 플레이하고 직접 제작해 올릴 수 있는 플레이그라운드입니다. 각 타이니앱의 주간 1등에 도전해 명예의 전당 포인트를 획득하세요!
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => openQuickPlay(featuredApp)}
                className="px-5 py-3 rounded-2xl bg-arcade-coral hover:bg-arcade-coralHover active:scale-95 text-white font-display font-bold text-sm shadow-btn-play transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M4.5 3.5v13L16.5 10 4.5 3.5z" />
                </svg>
                <span>{featuredApp.title.split(':')[0]} 바로 플레이</span>
              </button>
              <Link
                to="/apps"
                className="px-4 py-3 rounded-2xl bg-warm-100 hover:bg-warm-200 border border-warm-200 text-warm-800 font-bold text-xs sm:text-sm transition-all"
              >
                전체 타이니앱 둘러보기
              </Link>
              <Link
                to="/apps/register"
                className="px-3.5 py-3 rounded-2xl text-warm-600 hover:text-arcade-coral font-bold text-xs sm:text-sm transition-colors"
              >
                + 나만의 앱 등록하기
              </Link>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-4 pt-3 border-t border-warm-200/80 max-w-md">
              <div>
                <div className="font-mono font-extrabold text-base text-warm-900">{apps.length}개</div>
                <div className="text-[11px] text-warm-500">승인된 타이니앱</div>
              </div>
              <div>
                <div className="font-mono font-extrabold text-base text-warm-900">
                  {apps.reduce((sum, app) => sum + app.playCount, 0).toLocaleString()}회
                </div>
                <div className="text-[11px] text-warm-500">누적 플레이</div>
              </div>
              <div>
                <div className="font-mono font-extrabold text-base text-arcade-coral">
                  월요일 00시
                </div>
                <div className="text-[11px] text-warm-500">주간 1등 포인트 정산</div>
              </div>
            </div>
          </div>

          {/* Right Hero Featured App Card (5 Cols - F5 리로드 시마다 모드 랜덤 노출) */}
          <div className="col-span-12 lg:col-span-5">
            <div
              onClick={() => navigate(`/apps/${featuredApp.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  navigate(`/apps/${featuredApp.id}`)
                }
              }}
              className="relative rounded-2xl overflow-hidden border-2 border-warm-200 shadow-xl bg-warm-900 group cursor-pointer"
            >
              <div className="aspect-[16/10] w-full overflow-hidden relative">
                <AppThumbnail
                  url={featuredApp.thumbnailUrl}
                  title={featuredApp.title}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                {/* Top Curation Mode Badge */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                  {showOfficial ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-md">
                      <span>📌 공식 대표 학습 앱</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-arcade-coral text-white shadow-md">
                      <span>🔥 이번 주 참여 1위 핫 앱</span>
                    </span>
                  )}
                  {featuredApp.categoryTag && (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-black/60 text-white backdrop-blur-md">
                      {featuredApp.categoryTag}
                    </span>
                  )}
                </div>

                {/* Bottom Featured App Info */}
                <div className="absolute bottom-3.5 left-4 right-4 text-white space-y-1.5">
                  <div className="text-[11px] font-mono text-amber-300 font-semibold">
                    {showOfficial
                      ? `🎓 코딩 개념 입문 추천 · 누적 추천 ${featuredApp.recommendCount}회`
                      : featuredApp.weeklyParticipants != null
                        ? `⚡ 이번 주 도전자 ${featuredApp.weeklyParticipants}명 참여 중 (주간 1등 포인트 최고 배당권)`
                        : `⚡ 추천 ${featuredApp.recommendCount}회 · 주간 1등 도전 중`}
                  </div>
                  <h3 className="font-display font-extrabold text-lg sm:text-xl text-white leading-snug">
                    {featuredApp.title}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-warm-200 pt-1">
                    <span>
                      제작: <strong>{featuredApp.creatorNickname || featuredApp.creatorHandle}</strong>
                      {featuredApp.weeklyTopScore != null && (
                        <>
                          {' '}• 주간 1위:{' '}
                          <strong className="text-amber-300 font-mono">
                            {featuredApp.weeklyTopScore.toLocaleString()}점
                          </strong>
                        </>
                      )}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-white/20 group-hover:bg-arcade-coral text-white font-bold text-[11px] transition-colors">
                      상세 보기 →
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN 2-COLUMN DASHBOARD (7 Cols App Gallery : 5 Cols Weekly Hall of Fame) */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (7 Cols): Official Apps + Popular User Apps */}
        <div className="col-span-12 lg:col-span-7 space-y-6">
          {/* Official Coding Learning Apps */}
          <section className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">🎓</span>
                  <h2 className="font-display font-extrabold text-lg sm:text-xl text-warm-900 tracking-tight">
                    공식 코딩학습 타이니앱
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    OFFICIAL
                  </span>
                </div>
                <p className="text-xs text-warm-500 mt-0.5">
                  코딩 개념을 게임으로 익히는 TinyArcade 공식 학습 앱
                </p>
              </div>
              <Link
                to="/apps?filter=official"
                className="text-xs font-bold text-arcade-coral hover:text-arcade-coralHover"
              >
                공식 앱 전체 보기 →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {officialApps.map((app) => (
                <div
                  key={app.id}
                  onClick={() => navigate(`/apps/${app.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      navigate(`/apps/${app.id}`)
                    }
                  }}
                  className="bg-white border border-warm-200 rounded-2xl overflow-hidden shadow-warm-card hover:shadow-warm-hover transition-all group flex flex-col cursor-pointer"
                >
                  <div className="aspect-[16/10] bg-warm-100 relative overflow-hidden border-b border-warm-200">
                    <AppThumbnail
                      url={app.thumbnailUrl}
                      title={app.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/95 text-emerald-700 shadow-sm border border-emerald-100">
                      ● OFFICIAL
                    </span>
                  </div>
                  <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                    <div>
                      {app.categoryTag && (
                        <div className="text-[10px] font-mono text-warm-400 truncate">
                          {app.categoryTag}
                        </div>
                      )}
                      <h3 className="font-display font-bold text-xs sm:text-sm text-warm-900 group-hover:text-arcade-coral transition-colors line-clamp-1 mt-0.5">
                        {app.title}
                      </h3>
                      <p className="text-[11px] text-warm-500 line-clamp-2 mt-1 leading-relaxed">
                        {app.description}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-warm-100 flex items-center justify-between text-[11px]">
                      <span className="text-warm-500 font-mono">
                        👍 {app.recommendCount} · 🎮 {app.playCount.toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          openQuickPlay(app)
                        }}
                        className="px-2.5 py-1 rounded-lg bg-warm-100 hover:bg-arcade-coral hover:text-white font-bold text-warm-700 transition-colors"
                      >
                        플레이
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {MAINTENANCE_APPS.filter((m) => m.isOfficial).map((m) => (
                <MaintenanceAppCard key={`maintenance-${m.id}`} app={m} />
              ))}
            </div>
          </section>

          {/* Popular User Created Apps */}
          <section className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">✨</span>
                  <h2 className="font-display font-extrabold text-lg sm:text-xl text-warm-900 tracking-tight">
                    인기 유저 창작 타이니앱
                  </h2>
                </div>
                <p className="text-xs text-warm-500 mt-0.5">
                  유저들이 직접 만들어 올린 학습 TinyArcade 앱
                </p>
              </div>
              <Link
                to="/apps?filter=user"
                className="text-xs font-bold text-arcade-coral hover:text-arcade-coralHover"
              >
                유저 앱 더보기 →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {userApps.map((app) => (
                <div
                  key={app.id}
                  onClick={() => navigate(`/apps/${app.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      navigate(`/apps/${app.id}`)
                    }
                  }}
                  className="bg-white border border-warm-200 rounded-2xl overflow-hidden shadow-warm-card hover:shadow-warm-hover transition-all group flex flex-col cursor-pointer"
                >
                  <div className="aspect-[16/10] bg-warm-100 relative overflow-hidden border-b border-warm-200">
                    <AppThumbnail
                      url={app.thumbnailUrl}
                      title={app.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/95 text-warm-700 shadow-sm border border-warm-200">
                      USER
                    </span>
                  </div>
                  <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                    <div>
                      {app.categoryTag && (
                        <div className="text-[10px] font-mono text-warm-400 truncate">
                          {app.categoryTag}
                        </div>
                      )}
                      <h3 className="font-display font-bold text-xs sm:text-sm text-warm-900 group-hover:text-arcade-coral transition-colors line-clamp-1 mt-0.5">
                        {app.title}
                      </h3>
                      <p className="text-[11px] text-warm-500 line-clamp-2 mt-1 leading-relaxed">
                        {app.description}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-warm-100 flex items-center justify-between text-[11px]">
                      <span className="text-warm-500 font-mono">
                        👍 {app.recommendCount} · 🎮 {app.playCount.toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          openQuickPlay(app)
                        }}
                        className="px-2.5 py-1 rounded-lg bg-warm-100 hover:bg-arcade-coral hover:text-white font-bold text-warm-700 transition-colors"
                      >
                        플레이
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {MAINTENANCE_APPS.filter((m) => !m.isOfficial).map((m) => (
                <MaintenanceAppCard key={`maintenance-${m.id}`} app={m} />
              ))}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN (5 Cols): Weekly Hall of Fame Summary */}
        <section className="col-span-12 lg:col-span-5 space-y-3.5 lg:sticky lg:top-20">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🏆</span>
                <h2 className="font-display font-extrabold text-lg sm:text-xl text-warm-900 tracking-tight">
                  이번 주 명예의 전당
                </h2>
              </div>
              <p className="text-xs text-warm-500 mt-0.5">
                최근 확정 주차 1등 포인트 합산 TOP 랭커
              </p>
            </div>
            <Link
              to="/ranking"
              className="text-xs font-bold text-arcade-coral hover:text-arcade-coralHover"
            >
              전체 랭킹 보기 →
            </Link>
          </div>

          <div className="bg-white border border-warm-200 rounded-3xl p-5 shadow-warm-card space-y-3">
            {weeklyRanking.length === 0 ? (
              <div className="p-6 text-center text-xs text-warm-500 font-bold">
                마감된 주간 랭킹 기록이 없습니다.
              </div>
            ) : (
              weeklyRanking.slice(0, 4).map((ranker) => {
                if (ranker.rank === 1) {
                  return (
                    <div
                      key={ranker.userId}
                      className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-amber-400 text-white font-black text-sm flex items-center justify-center shadow-sm">
                          1
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-display font-bold text-sm text-warm-900">
                              {ranker.nickname}
                            </span>
                            <span className="text-xs">👑</span>
                          </div>
                          <div className="text-[10px] text-warm-500 font-mono">
                            1위 타이니앱 {ranker.firstPlaceCount}개 보유
                          </div>
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="text-base font-black text-amber-800">
                          {ranker.totalPoints.toLocaleString()} pt
                        </div>
                        <div className="text-[10px] text-amber-600 font-bold">주간 1위 확정</div>
                      </div>
                    </div>
                  )
                }

                if (ranker.isMe) {
                  return (
                    <div
                      key={ranker.userId}
                      className="p-3 rounded-2xl bg-rose-50 border border-arcade-coral flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-arcade-coral text-white font-black text-xs flex items-center justify-center">
                          {ranker.rank}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm text-arcade-coral">
                              {ranker.nickname}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-rose-100 text-arcade-coral text-[9px] font-bold">
                              MY
                            </span>
                          </div>
                          {ranker.highlightNote && (
                            <div className="text-[10px] text-warm-500 font-mono">
                              {ranker.highlightNote}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="text-sm font-black text-arcade-coral">
                          {ranker.totalPoints.toLocaleString()} pt
                        </div>
                      </div>
                    </div>
                  )
                }

                return (
                  <div
                    key={ranker.userId}
                    className="p-3 rounded-2xl bg-warm-50 border border-warm-200 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-7 h-7 rounded-full font-black text-xs flex items-center justify-center ${
                          ranker.rank === 2
                            ? 'bg-warm-200 text-warm-700'
                            : 'bg-amber-700/20 text-amber-900'
                        }`}
                      >
                        {ranker.rank}
                      </span>
                      <div>
                        <span className="font-bold text-sm text-warm-800">{ranker.nickname}</span>
                        <div className="text-[10px] text-warm-400 font-mono">
                          1위 타이니앱 {ranker.firstPlaceCount}개 보유
                        </div>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-sm font-bold text-warm-900">
                        {ranker.totalPoints.toLocaleString()} pt
                      </div>
                    </div>
                  </div>
                )
              })
            )}

            <div className="pt-1">
              <Link
                to="/ranking"
                className="w-full py-2.5 rounded-xl bg-warm-100 hover:bg-warm-200 text-xs font-bold text-warm-800 transition-colors flex items-center justify-center gap-1.5"
              >
                <span>종합 명예의 전당 보러가기</span>
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* Quick Play Modal */}
      {playingApp && (
        <PlayModal
          key={modalSessionId}
          open={Boolean(playingApp)}
          title={playingApp.title}
          src={playingApp.playUrl}
          appId={playingApp.id}
          onClose={() => setPlayingApp(null)}
          onSubmitScore={(score) => {
            showToast(
              `🎉 ${playingApp.title} 점수 제출 완료! (${score.toLocaleString()}점)`,
              'success',
            )
          }}
          onNotify={showToast}
        />
      )}

      {/* Toast Container */}
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
