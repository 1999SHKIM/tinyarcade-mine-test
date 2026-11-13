import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getApp, type AppResponse } from '../../api/apps'
import { getErrorMessage } from '../../api/client'
import { AppThumbnail } from '../../features/apps/AppThumbnail'
import { CommentSection } from '../../features/comments/CommentSection'
import { LeaderboardSection } from '../../features/leaderboard/LeaderboardSection'
import { PlayModal } from '../../features/player/PlayModal'
import { VoteButtons } from '../../features/vote/VoteButtons'
import { formatKstDate } from '../../utils/date'

interface ToastItem {
  id: number
  message: string
  type: 'info' | 'success' | 'warn'
}

export function AppDetailPage() {
  const { appId } = useParams<{ appId: string }>()
  const numericId = Number(appId)

  const [app, setApp] = useState<AppResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const [modalOpen, setModalOpen] = useState(false)
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
    if (!appId || isNaN(numericId)) {
      setError('앱을 찾을 수 없습니다')
      setLoading(false)
      return
    }

    let mounted = true
    setLoading(true)
    setError(null)

    getApp(numericId)
      .then((data) => {
        if (mounted) {
          setApp(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!mounted) return
        if (err.response?.data?.code === 'APP_NOT_FOUND' || err.response?.status === 404) {
          setError('앱을 찾을 수 없습니다')
        } else {
          setError(getErrorMessage(err, '앱 정보를 불러올 수 없습니다.'))
        }
        setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [appId, numericId])

  const openPlayModal = useCallback(() => {
    setModalSessionId((prev) => prev + 1)
    setModalOpen(true)
    showToast('게임 세션 시작 (16:10 / 800×500 px 규격)', 'info')
  }, [showToast])

  // Space 단축키로 모달 실행 (댓글 입력 중이 아닐 때)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase()
      if (
        e.code === 'Space' &&
        !modalOpen &&
        activeTag !== 'textarea' &&
        activeTag !== 'input'
      ) {
        e.preventDefault()
        openPlayModal()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [modalOpen, openPlayModal])

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto rounded-3xl bg-white border border-warm-200 p-10 sm:p-14 text-center shadow-warm-card text-xs sm:text-sm text-warm-400">
        앱 정보를 불러오는 중입니다...
      </div>
    )
  }

  if (error || !app) {
    return (
      <div className="max-w-5xl mx-auto rounded-3xl bg-white border border-warm-200 p-10 sm:p-14 text-center shadow-warm-card space-y-4">
        <div className="text-4xl">🔍</div>
        <div className="space-y-1.5">
          <h1 className="font-display font-extrabold text-xl text-warm-900">
            {error || '앱을 찾을 수 없습니다'}
          </h1>
          <p className="text-xs sm:text-sm text-warm-500">
            존재하지 않거나 접근 권한이 없는 앱입니다.
          </p>
        </div>
        <div className="pt-2">
          <Link
            to="/apps"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-warm-900 text-white text-xs sm:text-sm font-bold hover:bg-warm-800 transition-all"
          >
            ← 앱 탐색 목록으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumb Path */}
      <div>
        <Link
          to="/apps"
          className="inline-flex items-center gap-2 text-xs font-bold text-warm-500 hover:text-warm-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          앱 탐색 목록으로 돌아가기
        </Link>
      </div>

      {/* MAIN PC WIDE 2-COLUMN VIEW (7 Cols vs 5 Cols) */}
      <div className="grid grid-cols-12 gap-5 sm:gap-6 items-start w-full">
        {/* LEFT COLUMN: App Info, Play Modal Trigger Button, Votes, Comments (7 Cols) */}
        <section className="col-span-12 md:col-span-7 space-y-5">
          {/* Main Game Card */}
          <div className="bg-white border border-warm-200 rounded-3xl overflow-hidden shadow-warm-card transition-shadow hover:shadow-warm-hover">
            {/* 16:10 Game Thumbnail Banner (인페이지 iframe 대신 썸네일 배너 + 클릭 시 모달 실행) */}
            <div className="relative w-full aspect-[16/10] bg-warm-100 overflow-hidden border-b border-warm-200 group">
              <AppThumbnail
                url={app.thumbnailUrl}
                title={app.title}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />

              {/* Floating Category Badges */}
              <div className="absolute top-3.5 left-3.5 flex flex-wrap gap-2">
                {app.isOfficial && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/95 text-emerald-700 shadow-sm border border-emerald-100 backdrop-blur-md">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    공식 앱 (Official)
                  </span>
                )}
              </div>

              {/* Hover Play Button Overlay (하단 게임 플레이하기 버튼과 동일한 디자인) */}
              <div
                onClick={openPlayModal}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    openPlayModal()
                  }
                }}
                aria-label="게임 모달로 플레이하기"
                className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer px-4"
              >
                <span className="py-3.5 px-7 rounded-2xl bg-arcade-coral hover:bg-arcade-coralHover active:scale-[0.98] text-white font-display font-black text-base sm:text-lg tracking-wide flex items-center justify-center gap-3 shadow-btn-play transform scale-95 group-hover:scale-100 transition-all">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                    <path d="M4.5 3.5v13L16.5 10 4.5 3.5z" />
                  </svg>
                  <span>게임 플레이하기</span>
                  <span className="text-xs font-sans font-semibold px-2.5 py-0.5 rounded-full bg-white/20 text-white ml-1">
                    16:10 모달 실행
                  </span>
                </span>
              </div>
            </div>

            {/* Card Content Body */}
            <div className="p-5 sm:p-6 space-y-5">
              {/* Header: Title, Creator & Metrics */}
              <div>
                <h1 className="font-display font-extrabold text-xl sm:text-2xl text-warm-900 tracking-tight">
                  {app.title}
                </h1>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-warm-500 font-medium">
                  <div className="flex items-center gap-1.5">
                    <span>제작자:</span>
                    <span className="font-bold text-warm-800">
                      {app.creatorNickname || app.creatorHandle || '알 수 없음'}
                    </span>
                    {app.isOfficial && (
                      <span className="px-1.5 py-0.5 rounded bg-warm-100 text-warm-700 font-semibold border border-warm-200">
                        공식
                      </span>
                    )}
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <span>총 플레이:</span>
                    <span className="font-mono font-bold text-warm-700">
                      {app.playCount.toLocaleString()}회
                    </span>
                  </div>
                  {app.createdAt && (
                    <>
                      <span>•</span>
                      <span>{formatKstDate(app.createdAt)} 등록</span>
                    </>
                  )}
                </div>
              </div>

              {/* Big Poki-Style Play Button (모달 실행 전용 버튼) */}
              <div>
                <button
                  type="button"
                  onClick={openPlayModal}
                  className="w-full py-3.5 px-6 rounded-2xl bg-arcade-coral hover:bg-arcade-coralHover active:scale-[0.99] text-white font-display font-black text-lg sm:text-xl tracking-wide flex items-center justify-center gap-3 shadow-btn-play transition-all group"
                >
                  <svg
                    className="w-6 h-6 fill-current transform group-hover:scale-110 transition-transform"
                    viewBox="0 0 20 20"
                  >
                    <path d="M4.5 3.5v13L16.5 10 4.5 3.5z" />
                  </svg>
                  <span>게임 플레이하기</span>
                  <span className="text-xs font-sans font-semibold px-2.5 py-0.5 rounded-full bg-white/20 text-white ml-1">
                    16:10 모달 실행
                  </span>
                </button>
                <div className="flex items-center justify-between text-xs text-warm-400 font-medium mt-2 px-1">
                  <span>⚡ 비로그인 체험 가능 (점수 저장은 회원 전용)</span>
                  <span className="font-mono">단축키: [Space]</span>
                </div>
              </div>

              {/* Description Block */}
              <div className="border-t border-warm-100 pt-4 space-y-1.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-warm-400 font-mono">
                  앱 소개
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed text-warm-600">
                  {app.description}
                </p>
              </div>

              {/* Useful Voting Bar */}
              <div className="border-t border-warm-100 pt-4">
                <VoteButtons
                  appId={app.id}
                  refreshKey={refreshKey}
                  initialRecommendCount={app.recommendCount}
                  initialNotRecommendCount={app.notRecommendCount}
                  onNotify={showToast}
                />
              </div>
            </div>
          </div>

          {/* Community Comments Section */}
          <CommentSection targetType="APP" targetId={app.id} onNotify={showToast} />
        </section>

        {/* RIGHT COLUMN: High Score Leaderboard (5 Cols - Sticky) */}
        <section className="col-span-12 md:col-span-5 space-y-4 md:sticky md:top-20">
          <LeaderboardSection
            appId={app.id}
            refreshKey={refreshKey}
            onStartPlay={openPlayModal}
            onNotify={showToast}
          />
        </section>
      </div>

      {/* 16:10 게임 플레이 모달 (버튼 클릭 시에만 열림) */}
      {modalOpen && (
        <PlayModal
          key={modalSessionId}
          open={modalOpen}
          title={app.title}
          src={app.playUrl}
          appId={app.id}
          onClose={() => setModalOpen(false)}
          onScoreSubmitted={(result) => {
            setRefreshKey((k) => k + 1)
            if (!result.testMode) {
              showToast(`점수 제출 완료! 최종 기록: ${result.score.toLocaleString()}점`, 'success')
            }
          }}
          onNotify={showToast}
        />
      )}

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
