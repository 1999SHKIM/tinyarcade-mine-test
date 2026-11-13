# TinyArcade 타이니앱 제작 규칙 (AI용)

> 이 문서를 AI에게 그대로 붙여 넣고 "이 규칙대로 TinyArcade에 올릴 게임을 만들어 줘"라고 요청하세요.
> 사람용 설명은 TinyArcade 사이트의 **따라해보세요** 페이지에 있습니다.

## 1. 목표
- TinyArcade(https://tinyarcade-two.vercel.app)에 등록할 **브라우저 미니게임**을 만든다.
- 게임은 플랫폼 화면 안의 iframe에서 실행되고, 한 판이 끝나면 **점수를 플랫폼 SDK로 제출**한다.

## 2. 꼭 지킬 규격
- **정적 파일만**: HTML·CSS·JS·이미지·소리만 쓴다. 자체 서버·DB·로그인 기능을 만들지 않는다.
- **공개 GitHub 레포**에 올린다. 플랫폼은 등록 시점의 커밋을 그대로 쓴다.
- **화면 비율 16:10**, 기준 크기 **800×500px**. 창 크기가 달라도 비율을 유지하며 축소·확대되게 만든다.
- **파일 하나당 5MB 이하**. 긴 배경음악(mp3)은 짧게 자르고, 글꼴은 `.woff2`를 쓴다.
- iframe은 `sandbox="allow-scripts"`만 허용한다. 그래서 다음은 **쓸 수 없다**.
  - `localStorage`, `sessionStorage`, 쿠키 (쓰면 오류) → 진행 상태는 변수로만 기억한다.
  - `alert`·`confirm`·팝업·새 창 열기, 폼 제출, 상위 페이지 이동 → 게임 화면 안에서 직접 그린다.
- 모든 경로는 **상대 경로**로 만든다(맨 앞 `/` 금지). 게임은 `https://…/apps/{임의주소}/` 아래에서 열린다.

## 3. SDK 사용법
SDK 파일: https://tinyarcade-two.vercel.app/sdk/tinyarcade-sdk.js
이 파일을 내려받아 프로젝트에 **복사**한다(Vite라면 `public/tinyarcade-sdk.js`).

`index.html`에서 게임 코드보다 먼저 불러온다.
```html
<script src="./tinyarcade-sdk.js"></script>
<script type="module" src="/src/main.ts"></script>
```

SDK는 `window.TinyArcade`에 두 함수를 준다.
```js
// 한 판 시작 (예: [시작] 버튼을 눌렀을 때)
const s = await TinyArcade.start()
// s = { sessionId, testMode, loggedIn }
// - loggedIn이 false면 "로그인하면 점수가 기록됩니다" 안내
// - testMode가 true면 승인 전 미리보기 → "미리보기 · 기록 안 됨" 안내

// 한 판 끝 (게임오버·클리어 어느 쪽이든 한 번만)
try {
  const r = await TinyArcade.submitScore(850)
  // r = { score, verifyStatus, testMode }
  // - verifyStatus: 'NORMAL'(기록 완료) 또는 'PENDING'(기록 완료 · 검증 중)
  // - 미리보기(testMode)면 verifyStatus는 null
} catch (e) {
  // e = { code, message } → e.message를 화면에 보여 준다
}
```

TypeScript라면 타입을 선언한다.
```ts
declare global {
  interface Window {
    TinyArcade?: {
      version: string
      start(): Promise<{ sessionId: string | null; testMode: boolean; loggedIn: boolean }>
      submitScore(score: number): Promise<{ score: number; verifyStatus: 'NORMAL' | 'PENDING' | null; testMode: boolean }>
    }
  }
}
export {}
```

## 4. 한 판과 점수 규칙
- **`start()` 1번 = `submitScore()` 1번.** 다시 하려면 다시 `start()`를 부른다.
- 게임을 설계할 때 **언제 start, 언제 submit을 부를지 먼저 정한다.**
  - 예) 퀴즈: [시작] 버튼 → `start()`, 마지막 문제 뒤 결과 화면 → `submitScore()` 1번
  - 예) 모험 게임: 준비(스탯·미션)를 마치고 [출발]하는 순간 → `start()`, 클리어·게임오버 어느 쪽으로 끝나도 → `submitScore()` 1번
- **점수는 높을수록 좋은 숫자**로만 낸다. 0 이상, 소수 둘째 자리까지.
  - 시간이 짧을수록 좋은 게임: `남은 시간` 또는 `기준값 − 걸린 시간`처럼 바꿔서 낸다.
  - 횟수가 적을수록 좋은 게임: `기준 횟수 − 사용 횟수`처럼 바꿔서 낸다.
- 최고 점수가 정해진 게임은 그 값을 등록 때 "최대 점수"로 적는다(예: 개념 퀴즈 3550).
- 플랫폼 밖(새 탭)에서 열면 `start()`는 `loggedIn: false`, `submitScore()`는 실패한다. 이때도 게임은 끝까지 할 수 있어야 한다.

## 5. 빌드와 레포 설정 (Vite 기준)
`vite.config.ts`
```ts
import { defineConfig } from 'vite'
export default defineConfig({
  base: './', // 필수: 상대 경로로 빌드
})
```
- `npm run build` → `dist/` 폴더가 생긴다.
- **`dist`를 커밋한다.** `.gitignore`에 `dist`가 있으면 그 줄을 지운다.
- 커밋 후 push. 등록 뒤에 고친 내용은 반영되지 않으므로, 고쳤다면 새로 등록한다.

## 6. 등록할 때 필요한 정보
작업이 끝나면 아래를 정리해서 알려 준다.
- 레포 주소: `https://github.com/아이디/레포이름`
- **진입 HTML 경로**: 빌드된 HTML. 예) `dist/index.html`
  - 레포 맨 위 `index.html`은 개발용 원본이라 등록하면 검은 화면이 된다.
- 제목, 설명(한두 문장)
- 썸네일(선택): png·jpg·webp, 500KB 이하, 16:10 권장
- 최대 점수(선택): 점수 상한이 있는 게임만

## 7. 완료 체크리스트
- [ ] `localStorage`·쿠키·`alert`·팝업을 쓰지 않는다
- [ ] 16:10(800×500 기준) 화면이 창 크기에 맞게 비율을 유지한다
- [ ] `index.html`이 `tinyarcade-sdk.js`를 게임 코드보다 먼저 불러온다
- [ ] 한 판에 `start()` 1번, `submitScore()` 1번
- [ ] 점수는 높을수록 좋은 0 이상의 숫자, 소수 둘째 자리까지
- [ ] `start()`의 `loggedIn`·`testMode`, `submitScore()`의 결과·오류를 화면에 안내한다
- [ ] `vite.config`에 `base: './'`, 빌드한 `dist`를 커밋했다
- [ ] 파일 하나가 5MB를 넘지 않는다
- [ ] 진입 HTML 경로는 빌드된 HTML(예: `dist/index.html`)이다
