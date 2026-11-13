import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

// [참고] 따라해보세요 가이드 (05_30)
// - 크리에이터가 게임을 만들어 TinyArcade에 올리는 순서를 단계 0~7로 보여 준다(사람용).
// - 맨 아래 AI용 MD는 public/tinyarcade-ai-guide.md 파일 하나를 불러와 미리보기·복사·다운로드한다.
//   내용을 고칠 때는 그 파일만 고치면 된다(화면에 같은 글을 두 번 적지 않음).
// - 예시 게임: 개념 퀴즈(SDK 연동 완료 예시), 코드 어드벤처(언제 start·submit을 부를지 정하는 설계 예시).

const AI_GUIDE_PATH = '/tinyarcade-ai-guide.md'
const SDK_PATH = '/sdk/tinyarcade-sdk.js'
const SDK_URL = 'https://tinyarcade-two.vercel.app/sdk/tinyarcade-sdk.js'
const QUIZ_REPO = 'https://github.com/1999SHKIM/tinyapp-quiz'
const ADVENTURE_REPO = 'https://github.com/jyuus-maker/tiny-code-adventure'

function Code({ children }: { children: string }) {
  return (
    <pre className="bg-warm-900 text-warm-50 text-[11px] sm:text-xs leading-relaxed rounded-xl p-4 overflow-x-auto font-mono">
      <code>{children}</code>
    </pre>
  )
}

function Step({ no, title, children }: { no: number; title: string; children: ReactNode }) {
  return (
    <section className="bg-white border border-warm-200 rounded-3xl p-5 sm:p-6 shadow-warm-card space-y-3 min-w-0">
      <div className="flex items-center gap-3">
        <span className="w-8 h-8 shrink-0 rounded-full bg-arcade-coral text-white font-display font-black text-sm flex items-center justify-center">
          {no}
        </span>
        <h2 className="font-display font-extrabold text-lg sm:text-xl text-warm-900 tracking-tight">{title}</h2>
      </div>
      <div className="text-sm text-warm-700 leading-relaxed space-y-3">{children}</div>
    </section>
  )
}

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="font-semibold text-arcade-coral hover:text-arcade-coralHover underline underline-offset-2 break-all"
    >
      {children}
    </a>
  )
}

export function GuidePage() {
  const [aiGuide, setAiGuide] = useState<string | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')

  // 화면이 열릴 때 AI용 MD 파일을 한 번 불러온다
  useEffect(() => {
    fetch(AI_GUIDE_PATH)
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status))
        return res.text()
      })
      .then(setAiGuide)
      .catch(() => setLoadFailed(true))
  }, [])

  // [참고] navigator.clipboard: 브라우저 클립보드에 글을 넣는다. https(또는 localhost)에서만 동작한다.
  const handleCopy = () => {
    if (!aiGuide) return
    navigator.clipboard
      .writeText(aiGuide)
      .then(() => setCopyState('copied'))
      .catch(() => setCopyState('failed'))
      .finally(() => setTimeout(() => setCopyState('idle'), 2000))
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* 머리말 */}
      <section className="bg-white border border-warm-200 rounded-3xl p-5 sm:p-6 shadow-warm-card space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🧭</span>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-warm-900 tracking-tight">
            따라해보세요
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-warm-500">
          내가 만든 미니게임을 TinyArcade에 올리는 방법입니다. 위에서부터 순서대로 따라 하고, AI로 만든다면 맨 아래
          AI용 MD를 복사해 붙여 넣으세요.
        </p>
      </section>

      <Step no={0} title="한눈에 보기">
        <ol className="list-decimal pl-5 space-y-1">
          <li>게임 만들기 (16:10 정적 웹 게임)</li>
          <li>SDK 연결 (한 판 시작·점수 제출)</li>
          <li>빌드해서 공개 GitHub 레포에 올리기</li>
          <li>
            <Link to="/apps/register" className="font-semibold text-arcade-coral hover:text-arcade-coralHover">
              앱 등록
            </Link>
          </li>
          <li>미리보기로 확인 → 관리자 승인 → 목록에 공개</li>
        </ol>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="rounded-2xl bg-warm-50 border border-warm-200 p-4 space-y-1">
            <div className="text-xs font-bold text-emerald-700">예시 1 · SDK 연동 완료</div>
            <div className="font-bold text-warm-900">개념 퀴즈 (Java)</div>
            <ExternalLink href={QUIZ_REPO}>{QUIZ_REPO}</ExternalLink>
          </div>
          <div className="rounded-2xl bg-warm-50 border border-warm-200 p-4 space-y-1">
            <div className="text-xs font-bold text-warm-600">예시 2 · 게임 설계 참고</div>
            <div className="font-bold text-warm-900">코드 어드벤처</div>
            <ExternalLink href={ADVENTURE_REPO}>{ADVENTURE_REPO}</ExternalLink>
          </div>
        </div>
      </Step>

      <Step no={1} title="앱 규격">
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>정적 파일만</strong>: HTML·CSS·JS·이미지·소리. 자체 서버·DB는 쓰지 않습니다.
          </li>
          <li>
            <strong>공개(Public) GitHub 레포</strong>에 올립니다.
          </li>
          <li>
            화면은 <strong>16:10</strong>, 기준 크기 <strong>800×500</strong>. 창 크기에 맞춰 비율을 유지하게 만드세요.
          </li>
          <li>
            게임 파일 <strong>하나당 5MB 이하</strong>. 긴 배경음악은 짧게, 글꼴은 <code>.woff2</code>를 권장합니다.
          </li>
          <li>
            게임은 보안 칸(sandbox) 안에서 실행됩니다. <code>localStorage</code>·쿠키·<code>alert</code>·팝업·새 창은
            쓸 수 없어요. 진행 상태는 변수로만 기억하세요.
          </li>
        </ul>
      </Step>

      <Step no={2} title="게임 설계: 한 판과 점수">
        <p>
          SDK 규칙은 하나입니다. <strong>start() 1번 = submitScore() 1번.</strong> 그래서 게임을 만들기 전에 "언제 한
          판이 시작되고 언제 끝나는지"를 먼저 정하세요.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm border border-warm-200 rounded-xl overflow-hidden">
            <thead className="bg-warm-100 text-warm-800">
              <tr>
                <th className="text-left p-2.5">게임</th>
                <th className="text-left p-2.5">start()</th>
                <th className="text-left p-2.5">submitScore()</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100">
              <tr>
                <td className="p-2.5 font-semibold">개념 퀴즈</td>
                <td className="p-2.5">[시작] 버튼을 누를 때</td>
                <td className="p-2.5">마지막 문제 뒤 결과 화면에서 1번</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold">코드 어드벤처</td>
                <td className="p-2.5">스탯·미션 준비를 마치고 [출발]하는 순간</td>
                <td className="p-2.5">클리어·게임오버 어느 쪽으로 끝나도 1번</td>
              </tr>
            </tbody>
          </table>
        </div>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            점수는 <strong>높을수록 좋은 숫자</strong>로만 냅니다. 0 이상, 소수 둘째 자리까지.
          </li>
          <li>
            시간이 짧을수록 좋은 게임은 <code>남은 시간</code> 또는 <code>기준값 − 걸린 시간</code>처럼 바꿔서 내세요.
          </li>
          <li>
            최고 점수가 정해진 게임은 등록할 때 <strong>최대 점수</strong>를 적어 주세요(개념 퀴즈는 3550).
          </li>
        </ul>
      </Step>

      <Step no={3} title="SDK 연결">
        <p>
          ① SDK 파일을 받아{' '}
          <a
            href={SDK_PATH}
            download="tinyarcade-sdk.js"
            className="font-semibold text-arcade-coral hover:text-arcade-coralHover underline underline-offset-2"
          >
            tinyarcade-sdk.js 다운로드
          </a>{' '}
          게임 프로젝트에 복사합니다(Vite라면 <code>public/tinyarcade-sdk.js</code>). 주소:{' '}
          <span className="font-mono text-xs break-all">{SDK_URL}</span>
        </p>
        <p>② <code>index.html</code>에서 게임 코드보다 먼저 불러옵니다.</p>
        <Code>{`<script src="./tinyarcade-sdk.js"></script>
<script type="module" src="/src/main.tsx"></script>`}</Code>
        <p>③ 한 판 시작과 끝에서 부릅니다. 결과에 따라 안내 문구를 보여 주세요.</p>
        <Code>{`// 한 판 시작
const s = await TinyArcade.start()      // { sessionId, testMode, loggedIn }
if (!s.loggedIn) show('로그인하면 점수가 기록됩니다.')
else if (s.testMode) show('미리보기 · 기록 안 됨')

// 한 판 끝 (한 번만)
try {
  const r = await TinyArcade.submitScore(850)  // { score, verifyStatus, testMode }
  if (r.testMode) show('미리보기 · 기록 안 됨')
  else if (r.verifyStatus === 'PENDING') show('기록 완료 · 검증 중')
  else show('기록 완료')
} catch (e) {
  show('기록 실패: ' + e.message)            // e = { code, message }
}`}</Code>
        <p className="text-xs text-warm-500">
          개념 퀴즈의 실제 코드는 레포의 <code>index.html</code>, <code>src/platform/sdk.ts</code>,{' '}
          <code>src/platform/tinyarcade.d.ts</code>(TypeScript 타입)를 참고하세요. 플랫폼 밖(새 탭)에서 열면 비로그인처럼
          동작합니다.
        </p>
      </Step>

      <Step no={4} title="빌드와 레포">
        <p>
          Vite라면 <code>vite.config</code>에 <strong>
            <code>base: './'</code>
          </strong>
          를 꼭 넣으세요. 게임은 플랫폼의 임의 주소 아래에서 열리기 때문에 상대 경로여야 파일을 찾습니다.
        </p>
        <Code>{`export default defineConfig({
  base: './',
  plugins: [react()],
})`}</Code>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <code>npm run build</code> → <code>dist/</code> 폴더가 생깁니다.
          </li>
          <li>
            <strong>
              <code>dist</code>를 커밋
            </strong>
            합니다. <code>.gitignore</code>에 <code>dist</code>가 있으면 그 줄을 지우세요.
          </li>
          <li>플랫폼은 등록 시점의 커밋을 그대로 씁니다. 등록 뒤에 고쳤다면 새로 등록해야 반영됩니다.</li>
        </ul>
      </Step>

      <Step no={5} title="앱 등록">
        <p>
          <Link to="/apps/register" className="font-semibold text-arcade-coral hover:text-arcade-coralHover">
            앱 등록 화면
          </Link>
          에 아래를 적습니다.
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>레포 주소: <code>https://github.com/아이디/레포이름</code></li>
          <li>
            <strong>진입 HTML 경로 = 빌드된 HTML</strong>. 예: <code>dist/index.html</code>(코드 어드벤처),{' '}
            <code>dist/java/index.html</code>(개념 퀴즈). 레포 맨 위 <code>index.html</code>은 개발용 원본이라 검은
            화면이 됩니다.
          </li>
          <li>제목·설명, 썸네일(선택: png·jpg·webp, 500KB 이하, 16:10 권장), 최대 점수(선택)</li>
        </ul>
      </Step>

      <Step no={6} title="미리보기와 승인">
        <ul className="list-disc pl-5 space-y-1">
          <li>등록하면 <strong>승인 대기</strong> 상태가 되고, 본인과 관리자만 미리보기로 실행할 수 있습니다.</li>
          <li>
            미리보기는 <strong>테스트 모드</strong>라 점수가 기록되지 않습니다. SDK 연동이 되는지 여기서 확인하세요.
          </li>
          <li>관리자가 규격·SDK 연동·유해성·로딩 속도를 보고 승인 또는 반려합니다. 반려되면 고쳐서 새로 등록하세요.</li>
        </ul>
      </Step>

      <Step no={7} title="자주 막히는 곳">
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm border border-warm-200 rounded-xl overflow-hidden">
            <thead className="bg-warm-100 text-warm-800">
              <tr>
                <th className="text-left p-2.5">증상</th>
                <th className="text-left p-2.5">확인할 것</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100">
              <tr>
                <td className="p-2.5 font-semibold">검은 화면</td>
                <td className="p-2.5">진입 경로가 개발용 <code>index.html</code>이 아닌지 (빌드된 HTML로)</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold">그림·스크립트 404</td>
                <td className="p-2.5">
                  <code>base: './'</code>가 빠졌는지, 경로 맨 앞에 <code>/</code>가 있는지
                </td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold">점수가 안 올라감</td>
                <td className="p-2.5">
                  start 없이 submit, 한 판에 submit 두 번, 비로그인, 음수·소수 셋째 자리 점수
                </td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold">일부 파일만 안 받아짐</td>
                <td className="p-2.5">그 파일이 5MB를 넘는지</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold">저장이 안 됨·오류</td>
                <td className="p-2.5">
                  <code>localStorage</code>·쿠키를 쓰는지 (sandbox라 쓸 수 없음)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Step>

      {/* AI용 MD */}
      <section className="bg-white border border-warm-200 rounded-3xl p-5 sm:p-6 shadow-warm-card space-y-3 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🤖</span>
              <h2 className="font-display font-extrabold text-lg sm:text-xl text-warm-900 tracking-tight">AI용 MD</h2>
            </div>
            <p className="text-xs text-warm-500 mt-1">
              AI에게 붙여 넣고 "이 규칙대로 TinyArcade에 올릴 게임을 만들어 줘"라고 요청하세요.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopy}
              disabled={!aiGuide}
              className="px-4 py-2 rounded-xl bg-arcade-coral hover:bg-arcade-coralHover disabled:opacity-50 text-white text-xs font-bold transition-colors"
            >
              {copyState === 'copied' ? '복사했어요' : copyState === 'failed' ? '복사 실패' : '복사'}
            </button>
            <a
              href={AI_GUIDE_PATH}
              download="tinyarcade-ai-guide.md"
              className="px-4 py-2 rounded-xl bg-warm-100 hover:bg-warm-200 text-warm-800 text-xs font-bold transition-colors"
            >
              다운로드
            </a>
          </div>
        </div>
        {loadFailed ? (
          <p className="text-sm text-rose-600">AI용 MD를 불러오지 못했습니다. [다운로드]로 받아 주세요.</p>
        ) : (
          <pre className="bg-warm-50 border border-warm-200 text-warm-800 text-[11px] sm:text-xs leading-relaxed rounded-xl p-4 max-h-96 overflow-auto whitespace-pre-wrap break-words font-mono">
            {aiGuide ?? '불러오는 중...'}
          </pre>
        )}
      </section>
    </div>
  )
}
