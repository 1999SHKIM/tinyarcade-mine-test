// [김 담당] 게임(iframe) ↔ 플랫폼 중계: postMessage 수신·출처 확인·세션 시작·점수 제출 (03_13_tinyarcade_player)
//
// [참고] 흐름
// - 게임은 SDK(public/sdk/tinyarcade-sdk.js)로 "시작"·"점수"를 부모 창(이 화면)에 메시지로 보낸다.
// - 이 파일이 메시지를 받아 12번 세션 API(api/sessions.ts)를 부르고, 결과를 다시 게임에 메시지로 돌려준다.
// - 게임은 로그인 토큰을 볼 수 없다. 서버 호출은 언제나 이 화면이 한다(메인 §5·§10).
//
// [참고] 출처 확인을 event.source로 하는 이유
// - 게임 iframe은 sandbox="allow-scripts"(allow-same-origin 없음)라서 게임이 보낸 메시지의 event.origin은 "null"이다.
//   주소로는 구분할 수 없으므로 "메시지를 보낸 창이 우리가 만든 그 iframe의 창인가"로 확인한다.
// - 다른 탭·다른 iframe·브라우저 확장이 같은 모양의 메시지를 보내도 무시된다.
//
// [참고] 답장을 postMessage(msg, '*')로 보내는 이유
// - 두 번째 값은 "받을 창의 주소"인데, sandbox 게임의 주소는 "null"이라 지정할 수 없다.
// - 대신 받는 창을 iframe.contentWindow로 정확히 골라 보내고, 토큰 같은 비밀값은 절대 넣지 않는다.
//
// [참고] 메시지 계약은 "추가만" 한다 (03_13 PLY-N05)
// - 게임은 SDK를 복사해서 쓰므로, 이미 정한 type·칸 이름을 바꾸면 옛 SDK를 가진 게임이 고장 난다.
import axios from 'axios'
import { getErrorMessage } from '../../api/client'
import { startSession, submitScore, type VerifyStatus } from '../../api/sessions'

/** 게임 → 플랫폼 */
const MSG_START = 'TINYARCADE_START'
const MSG_SUBMIT = 'TINYARCADE_SUBMIT'
/** 플랫폼 → 게임 */
const MSG_STARTED = 'TINYARCADE_STARTED'
const MSG_SUBMITTED = 'TINYARCADE_SUBMITTED'
const MSG_ERROR = 'TINYARCADE_ERROR'

/** 점수 제출이 끝났을 때 플랫폼 화면(허의 PlayModal 등)에 알려 주는 내용 */
export interface ScoreSubmittedResult {
  score: number
  /** 테스트 모드(미리보기)면 null: 기록하지 않았다는 뜻 */
  verifyStatus: VerifyStatus | null
  testMode: boolean
}

/** 세션이 시작됐을 때 플랫폼 화면에 알려 주는 내용 (예: 미리보기면 "기록 안 됨" 표시) */
export interface SessionStartedResult {
  /** true면 승인 대기 앱 미리보기: 점수를 기록하지 않는다 */
  testMode: boolean
  /** false면 비로그인: 게임은 되지만 점수를 기록하지 않는다 */
  loggedIn: boolean
}

export interface SdkBridgeOptions {
  appId: number
  /** 메시지가 올 때마다 그 순간의 로그인 여부를 읽는다 (게임 도중 로그인·로그아웃 반영) */
  isLoggedIn: () => boolean
  onSessionStarted?: (result: SessionStartedResult) => void
  onScoreSubmitted?: (result: ScoreSubmittedResult) => void
}

/** 오류를 게임에 보낼 모양 { code, message }로 바꾼다 */
function toErrorPayload(error: unknown): { code: string; message: string } {
  const code = axios.isAxiosError(error) ? error.response?.data?.code : undefined
  return {
    code: typeof code === 'string' ? code : 'NETWORK_ERROR', // 서버 응답이 없으면 네트워크 오류
    message: getErrorMessage(error, '서버와 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.'),
  }
}

/**
 * iframe에 sdkBridge를 연결한다. 돌려받은 함수를 부르면 연결이 끊긴다(화면에서 사라질 때).
 */
export function connectSdkBridge(iframe: HTMLIFrameElement, options: SdkBridgeOptions): () => void {
  // 마지막으로 연 세션. 게임이 다른 번호로 제출하면 거부한다 (03_13 §2 "세션 번호 확인")
  let current: { sessionId: string | null; testMode: boolean } | null = null

  const reply = (message: Record<string, unknown>) => {
    iframe.contentWindow?.postMessage(message, '*')
  }
  const replyError = (code: string, message: string) => reply({ type: MSG_ERROR, code, message })

  const handleStart = async () => {
    if (!options.isLoggedIn()) {
      // 비로그인: 서버를 부르지 않는다. 게임은 실행되지만 점수는 기록되지 않는다 (01 A1)
      current = null
      reply({ type: MSG_STARTED, sessionId: null, testMode: false, loggedIn: false })
      options.onSessionStarted?.({ testMode: false, loggedIn: false })
      return
    }
    try {
      const session = await startSession(options.appId)
      current = { sessionId: session.sessionId, testMode: session.testMode }
      reply({ type: MSG_STARTED, sessionId: session.sessionId, testMode: session.testMode, loggedIn: true })
      options.onSessionStarted?.({ testMode: session.testMode, loggedIn: true })
    } catch (error) {
      const { code, message } = toErrorPayload(error)
      replyError(code, message)
    }
  }

  const handleSubmit = async (sessionId: unknown, score: unknown) => {
    if (!options.isLoggedIn()) {
      replyError('UNAUTHORIZED', '로그인하면 점수가 기록됩니다.') // 03_13 결정 ③
      return
    }
    if (typeof score !== 'number' || !Number.isFinite(score)) {
      replyError('INVALID_SCORE', '점수 형식이 올바르지 않습니다.') // 범위·소수 자리는 서버가 검사
      return
    }
    if (current === null || current.sessionId !== (sessionId ?? null)) {
      replyError('SESSION_NOT_FOUND', '게임을 먼저 시작해 주세요.') // 시작 없이 제출, 다른 세션 번호
      return
    }

    if (current.testMode) {
      // 미리보기(승인 대기 앱): 서버를 부르지 않고 완료로 답한다. 기록 없음 (메인 §5 테스트 모드)
      current = null
      reply({ type: MSG_SUBMITTED, score, verifyStatus: null, testMode: true })
      options.onScoreSubmitted?.({ score, verifyStatus: null, testMode: true })
      return
    }

    try {
      const result = await submitScore(current.sessionId as string, score)
      current = null // 세션 1개 = 제출 1번
      reply({ type: MSG_SUBMITTED, score: result.score, verifyStatus: result.verifyStatus, testMode: false })
      options.onScoreSubmitted?.({ score: result.score, verifyStatus: result.verifyStatus, testMode: false })
    } catch (error) {
      const { code, message } = toErrorPayload(error) // 예: SESSION_ALREADY_SUBMITTED, SESSION_EXPIRED
      replyError(code, message)
    }
  }

  const onMessage = (event: MessageEvent) => {
    if (event.source !== iframe.contentWindow) return // 우리가 띄운 게임이 보낸 것만 (PLY-N01)
    const data: unknown = event.data
    if (typeof data !== 'object' || data === null) return // 형식이 틀린 메시지는 무시 (PLY-N04)
    const msg = data as { type?: unknown; sessionId?: unknown; score?: unknown }

    if (msg.type === MSG_START) void handleStart()
    else if (msg.type === MSG_SUBMIT) void handleSubmit(msg.sessionId, msg.score)
    // 그 밖의 type은 무시한다 (나중에 계약이 추가돼도 옛 화면이 깨지지 않게)
  }

  window.addEventListener('message', onMessage)
  return () => window.removeEventListener('message', onMessage)
}
