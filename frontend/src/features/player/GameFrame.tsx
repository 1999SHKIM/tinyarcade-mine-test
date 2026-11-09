import { useEffect, useRef } from 'react'
import { useAuth } from '../auth/useAuth'
import { connectSdkBridge, type ScoreSubmittedResult, type SessionStartedResult } from './sdkBridge'

interface GameFrameProps {
  src?: string
  title?: string
  /** 앱 번호. 있으면 게임의 "시작·점수" 메시지를 받아 세션 API로 처리한다 (13번). 없으면 iframe만 띄운다 */
  appId?: number
  /** 게임이 한 판을 시작했을 때 (testMode면 미리보기, loggedIn이 false면 비로그인 → "기록 안 됨" 표시 등) */
  onSessionStarted?: (result: SessionStartedResult) => void
  /** 점수 제출이 끝났을 때 (testMode면 기록 없이 끝난 것) */
  onScoreSubmitted?: (result: ScoreSubmittedResult) => void
}

// [김 담당] 격리된 sandbox iframe 실행 영역 + sdkBridge 연결 (03_13_tinyarcade_player)
//
// [참고] sandbox="allow-scripts" 하나만 쓰는 이유 (03_13 PLY-N03, 메인 §10)
// - 게임은 일반 유저도 올릴 수 있다. sandbox는 "허락한 것만 할 수 있는 상자"다.
// - allow-scripts: 게임 JS 실행만 허락한다.
// - 추가 금지:
//   - allow-same-origin: 넣으면 게임이 플랫폼 쪽 저장소·쿠키를 읽을 수 있게 될 수 있다.
//   - allow-top-navigation: 게임이 우리 사이트 전체를 다른 주소로 이동시킬 수 있다.
//   - allow-popups: 팝업 창을 띄울 수 있다.
//   - allow-forms: 폼을 전송할 수 있다.
//
// [참고] useRef로 로그인 여부를 넘기는 이유
// - 로그인 상태가 바뀔 때마다 연결을 끊고 다시 만들면, 진행 중인 세션 정보(현재 세션 번호)가 사라진다.
// - 그래서 연결은 한 번만 만들고, 메시지가 올 때마다 ref에 담긴 "지금" 로그인 여부를 읽는다.
export function GameFrame({ src, title = 'TinyApp', appId, onSessionStarted, onScoreSubmitted }: GameFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const { isAuthenticated } = useAuth()

  const loggedInRef = useRef(isAuthenticated)
  const onStartedRef = useRef(onSessionStarted)
  const onSubmittedRef = useRef(onScoreSubmitted)
  useEffect(() => {
    loggedInRef.current = isAuthenticated
    onStartedRef.current = onSessionStarted
    onSubmittedRef.current = onScoreSubmitted
  })

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe || !src || appId === undefined) return // appId가 없으면 연결하지 않음 (지금 허 화면과 호환)
    const disconnect = connectSdkBridge(iframe, {
      appId,
      isLoggedIn: () => loggedInRef.current,
      onSessionStarted: (result) => onStartedRef.current?.(result),
      onScoreSubmitted: (result) => onSubmittedRef.current?.(result),
    })
    return disconnect // 화면에서 사라지거나 앱이 바뀌면 연결을 끊는다
  }, [src, appId])

  return (
    <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-slate-300 bg-slate-900 text-sm text-slate-300">
      {src ? (
        <iframe
          ref={iframeRef}
          src={src}
          title={title}
          sandbox="allow-scripts"
          className="h-full w-full rounded-lg"
        />
      ) : (
        <span>게임 실행 iframe 영역 (GameFrame - 김 담당)</span>
      )}
    </div>
  )
}
