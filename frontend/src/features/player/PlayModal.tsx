import { useEffect, useState } from 'react'
import { GameFrame } from './GameFrame'

interface PlayModalProps {
  open: boolean
  title: string
  src?: string
  appId?: number
  onClose: () => void
  onSubmitScore?: (score: number) => void
  onNotify?: (message: string, type?: 'info' | 'success' | 'warn') => void
}

// [허 담당] 16:10 모달 외형 (800x500 기준, 1x/1.25x 배율, 16:10 전체화면 레터박스, 중도 종료 확인 모달)
export function PlayModal({
  open,
  title,
  src,
  appId,
  onClose,
  onSubmitScore,
  onNotify,
}: PlayModalProps) {
  const [scale, setScale] = useState<1 | 1.25>(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isGameRunning, setIsGameRunning] = useState(true)
  const [confirmExitOpen, setConfirmExitOpen] = useState(false)
  const [currentScore, setCurrentScore] = useState(1500)
  const [isTestMode, setIsTestMode] = useState(false)

  const tryCloseModal = () => {
    if (isGameRunning && !isTestMode) {
      setConfirmExitOpen(true)
    } else {
      handleForceClose()
    }
  }

  const handleForceClose = () => {
    setConfirmExitOpen(false)
    setIsFullscreen(false)
    setIsGameRunning(false)
    onClose()
  }

  const toggleScale = () => {
    const next = scale === 1 ? 1.25 : 1
    setScale(next)
    onNotify?.(`게임 창 배율이 ${next}x로 변경되었습니다.`, 'info')
  }

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      setIsFullscreen(true)
      onNotify?.('16:10 전체화면 모드 (양옆 블랙 레터박스 적용)', 'info')
    } else {
      setIsFullscreen(false)
    }
  }

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false)
        } else if (confirmExitOpen) {
          setConfirmExitOpen(false)
        } else {
          if (isGameRunning && !isTestMode) {
            setConfirmExitOpen(true)
          } else {
            onClose()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, isFullscreen, confirmExitOpen, isGameRunning, isTestMode, onClose])

  if (!open) return null

  const dialogMaxWidth = scale === 1 ? 'max-w-[850px]' : 'max-w-[1050px]'
  const stageSizeStyle = isFullscreen
    ? {
        width: '100%',
        height: '100%',
        maxHeight: '100vh',
        maxWidth: 'calc(100vh * 1.6)',
        aspectRatio: '16 / 10',
      }
    : {
        width: scale === 1 ? '800px' : '1000px',
        height: scale === 1 ? '500px' : '625px',
        aspectRatio: '16 / 10',
      }

  return (
    <>
      {/* MODAL: Game Play Modal (16:10 Ratio, 800x500 base size) */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-warm-900/60 backdrop-blur-sm">
        <div
          className={`w-full ${dialogMaxWidth} bg-white border border-warm-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300`}
        >
          {/* Modal Platform Header (External to Game) */}
          <div className="h-14 px-5 bg-white border-b border-warm-200 flex items-center justify-between shrink-0 select-none">
            <div className="flex items-center gap-3">
              <span className="text-xl">🎮</span>
              <div>
                <div className="font-display font-extrabold text-sm sm:text-base text-warm-900 flex items-center gap-2">
                  <span>{title}</span>
                  {isTestMode ? (
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200 hidden sm:inline-block">
                      미리보기 테스트 모드 (점수 미기록)
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 hidden sm:inline-block">
                      세션 OPEN
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-warm-400 font-mono hidden sm:block">
                  기준 규격: 800 × 500 px (16:10 고정)
                </div>
              </div>
            </div>

            {/* Controls: Scale Toggle (1x/1.25x), Fullscreen, Close */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleScale}
                title="화면 배율 전환 (1x / 1.25x)"
                className="px-3 py-1.5 rounded-xl bg-warm-100 hover:bg-warm-200 text-xs font-mono font-bold text-warm-700 transition-colors flex items-center gap-1.5"
              >
                <span className="text-warm-400">배율:</span>
                <span className="text-arcade-coral">{scale}x</span>
              </button>

              <button
                type="button"
                onClick={toggleFullscreen}
                title="전체화면 모드 (16:10 레터박스)"
                className="p-2 rounded-xl bg-warm-100 hover:bg-warm-200 text-warm-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                  />
                </svg>
              </button>

              <button
                type="button"
                onClick={tryCloseModal}
                title="게임 창 닫기"
                className="p-2 rounded-xl bg-warm-100 hover:bg-rose-100 hover:text-arcade-coral text-warm-500 transition-colors ml-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Game Stage Wrapper (Dark surround) */}
          <div
            className={
              isFullscreen
                ? 'fixed inset-0 z-40 bg-black w-screen h-screen p-0 flex items-center justify-center overflow-hidden'
                : 'relative w-full flex items-center justify-center bg-warm-900 p-2 sm:p-4 overflow-hidden'
            }
          >
            {src ? (
              <div
                style={stageSizeStyle}
                className="relative max-w-full max-h-[75vh] overflow-hidden flex items-center justify-center"
              >
                <GameFrame
                  src={src}
                  title={title}
                  appId={appId}
                  onSessionStarted={(result) => {
                    if (result.testMode) {
                      setIsTestMode(true)
                      onNotify?.('미리보기 테스트 모드: 점수는 기록되지 않습니다.', 'info')
                    }
                  }}
                  onScoreSubmitted={(result) => {
                    setIsGameRunning(false)
                    if (result.testMode) {
                      onNotify?.(
                        `미리보기 점수 확인: ${result.score.toLocaleString()}점 (테스트 모드 - 미기록)`,
                        'info',
                      )
                    } else {
                      onSubmitScore?.(result.score)
                    }
                  }}
                />
              </div>
            ) : (
              /* The 16:10 Game Box (Simulated iframe: 800x500 base) */
              <div
                style={stageSizeStyle}
                className={`relative bg-[#1A202C] overflow-hidden shadow-2xl flex flex-col items-center justify-between p-6 select-none max-w-full ${
                  isFullscreen ? 'rounded-none border-0' : 'rounded-2xl max-h-[75vh] border border-slate-700'
                }`}
              >
                {/* In-Game Header HUD */}
                <div className="relative z-10 w-full flex items-center justify-between text-xs font-mono text-emerald-400 border-b border-slate-700 pb-2">
                  <div>STAGE 02: WHILE LOOP DUNGEON</div>
                  <div className="flex items-center gap-4 text-white">
                    <span>HP: ❤️❤️❤️</span>
                    <span>
                      SCORE:{' '}
                      <strong className="text-amber-400 text-sm">
                        {currentScore.toLocaleString()}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Inside Game Visual Mock */}
                <div className="relative z-10 flex flex-col items-center justify-center space-y-4 my-auto">
                  <div className="text-5xl animate-bounce">👾</div>
                  <div className="text-center space-y-1">
                    <div className="font-display font-extrabold text-base text-white tracking-wider">
                      코드 퀘스트 실행 중
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      가상 타이니앱 iframe 뷰포트 (800 × 500 px)
                    </div>
                  </div>

                  {/* In-game Action Trigger for Prototype Simulation */}
                  <div className="pt-2 flex flex-wrap gap-2.5 justify-center">
                    <button
                      type="button"
                      onClick={() => setCurrentScore((prev) => prev + 100)}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-600 text-xs font-mono font-bold text-slate-200 hover:text-white hover:border-arcade-coral transition-colors"
                    >
                      + 점수 획득 (+100)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsGameRunning(false)
                        onSubmitScore?.(currentScore)
                        handleForceClose()
                      }}
                      className="px-5 py-2 rounded-xl bg-arcade-coral text-white font-bold text-xs font-mono hover:bg-arcade-coralHover active:scale-95 shadow-md transition-all"
                    >
                      점수 제출 & 세션 완료 (SUBMIT)
                    </button>
                  </div>
                </div>

                {/* In-Game Footer HUD */}
                <div className="relative z-10 w-full flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-slate-700 pt-2">
                  <span>SDK: postMessage Bridge Active</span>
                  <span className="text-emerald-400">SESSION: a8f2-9bc3-41</span>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="h-10 px-5 bg-white border-t border-warm-200 flex items-center justify-between text-xs text-warm-500 font-medium shrink-0">
            <span>
              {isTestMode
                ? '💡 승인 대기 앱 미리보기입니다. SDK 연동 동작만 확인하며 점수는 기록되지 않습니다.'
                : '💡 게임 내에서 한 판을 끝까지 완료(Game Over/클리어)하면 점수가 리더보드에 자동 반영됩니다.'}
            </span>
            <span className="font-mono text-warm-400 hidden sm:inline">단축키: ESC로 닫기</span>
          </div>
        </div>
      </div>

      {/* FULLSCREEN FLOATING BAR (Exit Fullscreen Button) */}
      {isFullscreen && (
        <div className="fixed top-5 right-6 z-50 flex items-center gap-3 bg-white/95 border border-warm-300 rounded-full px-5 py-2.5 shadow-2xl backdrop-blur-md">
          <span className="text-xs font-bold text-warm-800 font-mono">
            16:10 전체화면 (ESC)
          </span>
          <button
            type="button"
            onClick={() => setIsFullscreen(false)}
            className="px-3 py-1 rounded-full bg-warm-900 hover:bg-warm-800 text-white text-xs font-bold transition-all"
          >
            전체화면 종료 ✕
          </button>
        </div>
      )}

      {/* CONFIRM CLOSE DIALOG (Prevent Session Loss) */}
      {confirmExitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-warm-900/80">
          <div className="bg-white border border-warm-200 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-500">
              <svg
                className="w-6 h-6 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h4 className="font-display font-bold text-warm-900 text-base">
                플레이 중인 게임을 중단하시겠습니까?
              </h4>
            </div>
            <div className="space-y-2.5 text-xs text-warm-600 leading-relaxed">
              <p>
                아직 게임 결과(점수 제출)가 완료되지 않았습니다. 게임이 끝나기 전에 창을 닫으면 현재 진행 중인 판의 점수는 리더보드에 기록되지 않습니다.
              </p>
              <div className="p-3 rounded-2xl bg-warm-50 border border-warm-200 text-warm-700 font-medium">
                💡 게임 내에서 한 판을 끝까지 완료(Game Over / 클리어)하면 점수가 리더보드에 자동 반영됩니다.
              </div>
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmExitOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-warm-100 hover:bg-warm-200 text-xs text-warm-700 font-bold transition-colors"
              >
                계속 플레이
              </button>
              <button
                type="button"
                onClick={handleForceClose}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs text-white font-bold transition-colors shadow-sm"
              >
                중단하고 닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
