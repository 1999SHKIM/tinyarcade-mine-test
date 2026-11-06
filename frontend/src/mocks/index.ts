import type {
  BoardType,
  CommentItem,
  LeaderboardEntry,
  OverallRankingEntry,
  PostItem,
  TinyApp,
  UserRole,
  UserStatus,
} from '../types'

// 김님 API가 나오기 전 사용하는 목(mock) 응답 모음. 실제 API 연결 후 삭제합니다.

export const MOCK_APP_DETAIL: TinyApp = {
  id: 1,
  creatorId: 100,
  creatorNickname: '알고히어로',
  creatorHandle: '@algo_hero',
  categoryTag: 'JavaScript • 턴제 퀴즈',
  bannerUrl: '/images/code-quest-banner.jpg',
  weeklyTopScore: 2850,
  weeklyParticipants: 184,
  title: '코드 퀘스트: 슬라임 던전 탈출기',
  description:
    '귀여운 슬라임들이 지키는 던전에서 조건문과 루프 퀴즈를 해결하며 탈출하세요! 턴수를 아끼고 정답을 연속으로 맞출수록 하이스코어 콤보 배수가 적용됩니다. 바이브코딩으로 뚝딱 만들어진 타이니앱의 경쾌한 손맛을 경험해보세요.',
  repoUrl: 'https://github.com/1999SHKIM/code-quest-slime',
  entryPath: 'index.html',
  status: 'APPROVED',
  isOfficial: true,
  maxScore: 5000,
  recommendCount: 142,
  notRecommendCount: 6,
  playCount: 1842,
  createdAt: '2026.11.01',
}

export const MOCK_APP_LIST: TinyApp[] = [
  MOCK_APP_DETAIL,
  {
    id: 2,
    creatorId: 101,
    creatorNickname: '파이썬튜터',
    creatorHandle: '@tutor_python',
    categoryTag: 'Python Data',
    bannerUrl: '/images/binary-snake-banner.jpg',
    weeklyTopScore: 1600,
    weeklyParticipants: 96,
    title: '바이너리 스네이크: 비트와 바이트',
    description:
      '2진수 사과를 올바른 순서대로 먹어 10진수 목표값을 완성하는 레트로 아케이드 게임입니다.',
    repoUrl: 'https://github.com/1999SHKIM/binary-snake',
    entryPath: 'index.html',
    status: 'APPROVED',
    isOfficial: true,
    maxScore: 3000,
    recommendCount: 95,
    notRecommendCount: 4,
    playCount: 920,
    createdAt: '2026.10.28',
  },
  {
    id: 3,
    creatorId: 102,
    creatorNickname: 'DB마스터',
    creatorHandle: '@db_master',
    categoryTag: 'SQL / RDBMS',
    bannerUrl: '/images/sql-miner-banner.jpg',
    weeklyTopScore: 2400,
    weeklyParticipants: 128,
    title: 'SQL 광부: 테이블 보석 발굴전',
    description:
      'SELECT, JOIN 문 쿼리를 조합해 제한 시간 내에 가장 귀한 데이터를 캐내는 퍼즐 아케이드.',
    repoUrl: 'https://github.com/1999SHKIM/sql-miner',
    entryPath: 'index.html',
    status: 'APPROVED',
    isOfficial: true,
    maxScore: 4000,
    recommendCount: 118,
    notRecommendCount: 5,
    playCount: 1405,
    createdAt: '2026.10.30',
  },
  {
    id: 4,
    creatorId: 201,
    creatorNickname: '정규식냥이',
    creatorHandle: '@regex_cat',
    categoryTag: 'Regex',
    bannerUrl: '/images/regex-cat-banner.jpg',
    weeklyTopScore: 980,
    weeklyParticipants: 74,
    title: '정규식 매칭 마스터: 냥이의 양피지',
    description:
      '정규식 패턴으로 올바른 이메일과 전화번호 주문을 완성하세요!',
    repoUrl: 'https://github.com/1999SHKIM/regex-cat',
    entryPath: 'index.html',
    status: 'APPROVED',
    isOfficial: false,
    maxScore: 1500,
    recommendCount: 88,
    notRecommendCount: 3,
    playCount: 540,
    createdAt: '2026.11.03',
  },
  {
    id: 5,
    creatorId: 202,
    creatorNickname: '픽셀히어로',
    creatorHandle: '@pixel_hero',
    categoryTag: 'TypeScript',
    bannerUrl: '/images/glitch-knight-banner.jpg',
    weeklyTopScore: 3420,
    weeklyParticipants: 215,
    title: '글리치 던전 나이트: 픽셀 서바이벌',
    description:
      '메모리 누수를 일으키는 버그 슬라임들을 베어 넘기는 서바이벌 액션! 이번 주 가장 많은 도전자가 몰린 인기 창작 게임입니다.',
    repoUrl: 'https://github.com/1999SHKIM/glitch-knight',
    entryPath: 'index.html',
    status: 'APPROVED',
    isOfficial: false,
    maxScore: 9999,
    recommendCount: 112,
    notRecommendCount: 2,
    playCount: 1120,
    createdAt: '2026.11.02',
  },
]

export const MOCK_WEEKLY_LEADERBOARD: LeaderboardEntry[] = [
  {
    id: 'sess-1',
    rank: 1,
    userId: 10,
    nickname: '코딩마스터',
    userStatus: 'ACTIVE',
    score: 2850,
    submittedAt: '11.04 14:20 달성',
    verifyStatus: 'NORMAL',
  },
  {
    id: 'sess-2',
    rank: 2,
    userId: 11,
    nickname: '버그사냥꾼',
    userStatus: 'ACTIVE',
    score: 2100,
    submittedAt: '11.05 19:12 달성',
    verifyStatus: 'NORMAL',
  },
  {
    id: 'sess-3',
    rank: 3,
    userId: 12,
    nickname: '알고리즘장인',
    userStatus: 'ACTIVE',
    score: 1950,
    submittedAt: '11.05 22:45 달성',
    verifyStatus: 'PENDING', // 검증 중... 표시 대상
  },
  {
    id: 'sess-4',
    rank: 4,
    userId: 1,
    nickname: '코딩꿈나무 (나)',
    userStatus: 'ACTIVE',
    score: 1420,
    submittedAt: '11.06 09:30 달성',
    verifyStatus: 'NORMAL',
    isMe: true,
  },
  {
    id: 'sess-5',
    rank: 5,
    userId: 13,
    nickname: '탈퇴한 유저',
    userStatus: 'WITHDRAWN',
    score: 1200,
    submittedAt: '11.03 18:10 달성',
    verifyStatus: 'NORMAL',
  },
  {
    id: 'sess-6',
    rank: 6,
    userId: 14,
    nickname: '파이썬조아',
    userStatus: 'ACTIVE',
    score: 1050,
    submittedAt: '11.04 11:05 달성',
    verifyStatus: 'NORMAL',
  },
  {
    id: 'sess-7',
    rank: 7,
    userId: 15,
    nickname: '루프탈출러',
    userStatus: 'ACTIVE',
    score: 980,
    submittedAt: '11.04 20:40 달성',
    verifyStatus: 'NORMAL',
  },
  {
    id: 'sess-8',
    rank: 8,
    userId: 16,
    nickname: '자바개발자',
    userStatus: 'ACTIVE',
    score: 850,
    submittedAt: '11.05 08:15 달성',
    verifyStatus: 'NORMAL',
  },
  {
    id: 'sess-9',
    rank: 9,
    userId: 17,
    nickname: '초보코더',
    userStatus: 'ACTIVE',
    score: 720,
    submittedAt: '11.05 15:22 달성',
    verifyStatus: 'NORMAL',
  },
  {
    id: 'sess-10',
    rank: 10,
    userId: 18,
    nickname: '타이니조아',
    userStatus: 'ACTIVE',
    score: 600,
    submittedAt: '11.06 01:10 달성',
    verifyStatus: 'NORMAL',
  },
]

export const MOCK_ALLTIME_LEADERBOARD: LeaderboardEntry[] = [
  {
    id: 'all-1',
    rank: 1,
    userId: 21,
    nickname: '전설의아케이더',
    userStatus: 'ACTIVE',
    score: 3420,
    submittedAt: '11.01 23:50 달성',
    verifyStatus: 'APPROVED',
  },
  ...MOCK_WEEKLY_LEADERBOARD.slice(0, 9).map((item, idx) => ({
    ...item,
    id: `all-${idx + 2}`,
    rank: idx + 2,
  })),
]

export const MOCK_WEEKLY_USER_RANKING: OverallRankingEntry[] = [
  {
    rank: 1,
    userId: 10,
    nickname: '코딩마스터',
    handle: '@master_of_code',
    totalPoints: 3450,
    firstPlaceCount: 3,
    firstPlaceApps: ['코드 퀘스트: 슬라임', '정규식 매칭 마스터', '글리치 던전 나이트'],
    highlightNote: '3개 앱 주간 1위 독점 달성',
  },
  {
    rank: 2,
    userId: 11,
    nickname: '버그사냥꾼',
    handle: '@bug_hunter_pro',
    totalPoints: 2810,
    firstPlaceCount: 2,
    firstPlaceApps: ['바이너리 스네이크', 'SQL 광부'],
    highlightNote: '2개 앱 주간 1위 달성',
  },
  {
    rank: 3,
    userId: 12,
    nickname: '알고리즘장인',
    handle: '@algo_artisan',
    totalPoints: 2420,
    firstPlaceCount: 1,
    firstPlaceApps: ['알고리즘 체스'],
    highlightNote: '1개 앱 주간 1위 달성',
  },
  {
    rank: 4,
    userId: 1,
    nickname: '코딩꿈나무 (나)',
    handle: '@coding_dreamer',
    totalPoints: 1420,
    firstPlaceCount: 1,
    firstPlaceApps: ['CSS 플렉스 프로그'],
    highlightNote: '포디움 진입까지 -1,000 pt',
    isMe: true,
  },
  {
    rank: 5,
    userId: 14,
    nickname: '파이썬조아',
    handle: '@python_lover',
    totalPoints: 1250,
    firstPlaceCount: 1,
    firstPlaceApps: ['리스트 컴프리헨션 러너'],
    highlightNote: '주간 1위 1개 보유',
  },
  {
    rank: 6,
    userId: 15,
    nickname: '루프탈출러',
    handle: '@loop_escaper',
    totalPoints: 1100,
    firstPlaceCount: 1,
    firstPlaceApps: ['재귀함수 타워'],
    highlightNote: '주간 1위 1개 보유',
  },
  {
    rank: 7,
    userId: 16,
    nickname: '자바개발자',
    handle: '@java_dev',
    totalPoints: 950,
    firstPlaceCount: 1,
    firstPlaceApps: ['가비지 컬렉터 디펜스'],
    highlightNote: '주간 1위 1개 보유',
  },
]

export const MOCK_ALLTIME_USER_RANKING: OverallRankingEntry[] = [
  {
    rank: 1,
    userId: 10,
    nickname: '코딩마스터',
    handle: '@master_of_code',
    totalPoints: 14820,
    firstPlaceCount: 11,
    firstPlaceApps: ['코드 퀘스트: 슬라임', '글리치 던전 나이트', '정규식 매칭 마스터'],
    highlightNote: '누적 11회 주간 1위 달성',
  },
  {
    rank: 2,
    userId: 21,
    nickname: '전설의아케이더',
    handle: '@arcade_legend',
    totalPoints: 12400,
    firstPlaceCount: 9,
    firstPlaceApps: ['바이너리 스네이크', '포인터 미로 찾기'],
    highlightNote: '누적 9회 주간 1위 달성',
  },
  {
    rank: 3,
    userId: 11,
    nickname: '버그사냥꾼',
    handle: '@bug_hunter_pro',
    totalPoints: 9650,
    firstPlaceCount: 7,
    firstPlaceApps: ['SQL 광부', '비동기 러너'],
    highlightNote: '누적 7회 주간 1위 달성',
  },
  {
    rank: 4,
    userId: 12,
    nickname: '알고리즘장인',
    handle: '@algo_artisan',
    totalPoints: 7320,
    firstPlaceCount: 5,
    firstPlaceApps: ['알고리즘 체스'],
    highlightNote: '누적 5회 주간 1위 달성',
  },
  {
    rank: 5,
    userId: 1,
    nickname: '코딩꿈나무 (나)',
    handle: '@coding_dreamer',
    totalPoints: 4280,
    firstPlaceCount: 3,
    firstPlaceApps: ['CSS 플렉스 프로그'],
    highlightNote: '누적 3회 주간 1위 달성',
    isMe: true,
  },
]

export const MOCK_APP_COMMENTS: CommentItem[] = [
  {
    id: 101,
    targetType: 'APP',
    targetId: 1,
    userId: 11,
    nickname: '버그잡는고양이',
    userStatus: 'ACTIVE',
    rankBadge: '주간 2위',
    content:
      '조건문 최적화하니까 턴수 줄어서 점수 대폭 상승하네요 ㅋㅋㅋ 주간 2위 박제 완료!',
    createdAt: '2시간 전',
    replies: [
      {
        id: 102,
        parentId: 101,
        userId: 100,
        nickname: '@algo_hero',
        userStatus: 'ACTIVE',
        isCreator: true,
        content:
          '공략법을 정확히 파악하셨네요! 다음 주차에 새로운 슬라임 패턴도 업데이트할게요 :)',
        createdAt: '1시간 전',
      },
    ],
  },
  {
    id: 103,
    targetType: 'APP',
    targetId: 1,
    userId: 13,
    nickname: '탈퇴한 유저',
    userStatus: 'WITHDRAWN',
    content: '킬링타임용으로 완성도 훌륭합니다. 난이도 밸런스가 딱 좋네요.',
    createdAt: '어제',
    replies: [],
  },
]

export const MOCK_RANKING_COMMENTS: CommentItem[] = [
  {
    id: 201,
    targetType: 'RANKING',
    targetId: null,
    userId: 17,
    nickname: '초보코더',
    userStatus: 'ACTIVE',
    rankBadge: '종합 9위',
    content:
      '코딩마스터님 3개 게임 전부 1위 독점 실화인가요 ㄷㄷ 슬라임 던전 턴수 줄이는 비결 좀 공유해주세요!',
    createdAt: '3시간 전',
    replies: [
      {
        id: 202,
        parentId: 201,
        userId: 10,
        nickname: '코딩마스터',
        userStatus: 'ACTIVE',
        content:
          '2스테이지 while 루프 구간에서 슬라임 두 마리를 한 번에 묶어서 처리하면 턴을 확 아낄 수 있어요!',
        createdAt: '1시간 전',
      },
    ],
  },
]

// ============================================================================
// [19번 게시판] 커뮤니티 게시글 & 게시글별 댓글 목데이터 및 세션 스토어
// ============================================================================

export const MOCK_POST_LIST: PostItem[] = [
  {
    id: 10,
    boardType: 'FAQ',
    userId: 999,
    nickname: '관리자허',
    userRole: 'ADMIN',
    userStatus: 'ACTIVE',
    title: '[필독] 타이니앱 등록 규격 및 High Score 점수 제출 가이드',
    content: `TinyArcade에 직접 만든 타이니앱(작은 웹 게임)을 등록하기 전 꼭 확인해야 할 핵심 규격 안내입니다.

## 1. 정적 파일 기반 동작 및 16:10 화면 규격
모든 타이니앱은 별도 백엔드 없이 **정적 파일(HTML, CSS, JS)**만으로 동작해야 하며, 플랫폼 내 **800 × 500 px (16:10 비율)** 격리된 모달(iframe) 안에서 실행됩니다.

## 2. 점수 방향은 무조건 High Score (높을수록 상위)
시간 단축형(Time Attack)이나 최소 턴수 클리어 게임이더라도 플랫폼에 제출하는 최종 점수는 **높을수록 상위**가 되도록 게임 내부에서 환산하여 제출해야 합니다.

\`\`\`javascript
// 예시: 제한 시간 300초 기준 남은 시간을 점수로 환산
const finalScore = Math.max(0, (300 - elapsedSeconds) * 10);
window.parent.postMessage({ type: 'TINYARCADE_SUBMIT_SCORE', score: finalScore }, '*');
\`\`\`

> "승인 대기(PENDING) 상태에서는 미리보기 테스트 모드로 실행되며, 관리자 검수 승인 후 정식 리더보드가 열립니다."`,
    views: 542,
    commentCount: 2,
    isPinned: true,
    createdAt: '2026.11.06 16:30',
  },
  {
    id: 9,
    boardType: 'FAQ',
    userId: 999,
    nickname: '관리자허',
    userRole: 'ADMIN',
    userStatus: 'ACTIVE',
    title: '주간 리더보드 마감 시각과 종합 유저 랭킹 포인트 산정 방식 안내',
    content: `앱별 주간 리더보드와 플랫폼 전체 종합 유저 랭킹의 차이를 안내해 드립니다.

## 앱 리더보드 vs 종합 유저 랭킹
- **앱 리더보드**: 개별 게임 안에서 제출된 원점수로 즉시 순위가 반영됩니다.
- **종합 유저 랭킹**: 매주 **월요일 00:00 KST** 주간 마감 시점에 각 앱의 주간 1등을 달성한 유저에게 앱 추천수·참여자수 계수를 반영한 종합 포인트를 부여합니다.

## 왜 내 점수 옆에 '검증 중...' 배지가 뜨나요?
앱에 설정된 고정 상한(\`max_score\`)을 초과하거나 통계적 극단값(Z-score)으로 분류된 기록은 제출 즉시 리더보드에 노출되지만 \`검증 중...\` 배지가 함께 표시됩니다. 주간 마감 전까지 관리자가 확인하며, 별도 치트가 아닌 정상 플레이는 모두 인정 처리됩니다.`,
    views: 389,
    commentCount: 1,
    isPinned: true,
    createdAt: '2026.11.06 15:10',
  },
  {
    id: 8,
    boardType: 'FREE',
    userId: 10,
    nickname: '코딩마스터',
    userRole: 'USER',
    userStatus: 'ACTIVE',
    title: '코드 퀘스트 슬라임 던전 2,850점 달성 공략 & 루프 최적화 팁 공유합니다',
    content: `이번 주 코드 퀘스트 주간 1위(2,850점) 찍으면서 정리한 스테이지별 턴 단축 공략입니다. 억울하면 여러분도 깨보세요 ㅎㅎ

## 핵심은 2스테이지 중첩 조건문 제거
초반에는 \`if-else\`를 매 턴마다 호출하기 쉬운데, 슬라임 두 마리가 같은 열에 모였을 때 \`while\` 조건 하나로 묶어 처리하면 턴 소모를 절반으로 줄일 수 있습니다.

\`\`\`javascript
while (slimeGroup.isAligned() && player.stamina > 0) {
  player.castChainLightning();
}
\`\`\`

- **1스테이지**: 보너스 코인 상자 무시하고 최단 경로 이동 (+300점 이득)
- **2스테이지**: 번개 콤보 3연속 유지 필수
- **보스전**: 마지막 턴에 남은 마나 전량 소모 시 콤보 배수 1.5배 적용

다들 몇 점까지 찍으셨나요? 더 빠른 루트 찾으신 분 댓글로 공유 부탁드립니다!`,
    views: 312,
    commentCount: 3,
    createdAt: '2026.11.06 11:20',
  },
  {
    id: 7,
    boardType: 'FREE',
    userId: 1,
    nickname: '코딩꿈나무',
    userRole: 'USER',
    userStatus: 'ACTIVE',
    title: '바이브코딩으로 첫 타이니앱(정규식 디펜스) 만들어서 등록해봤어요!',
    content: `코딩 입문 3주차인데 '따라해보세요' 가이드에 있는 AI용 MD 프롬프트를 그대로 복사해서 제미나이한테 주니까 30분 만에 16:10 캔버스 게임이 뚝딱 나왔습니다!

## 작업하면서 느낀 점
처음엔 \`postMessage\` SDK 연동이 어려울 줄 알았는데, 가이드에 적힌 세션 시작 신호와 점수 제출 스니펫만 넣으니까 미리보기 테스트 모드에서 바로 동작 확인이 되더라고요.

> "내가 짠 프롬프트와 코드가 실제 오락실 게임처럼 돌아가고 친구들이 점수를 경쟁한다는 게 진짜 재밌네요."

승인 완료되면 다들 한 번씩 플레이해 주시고 추천 부탁드립니다!`,
    views: 198,
    commentCount: 2,
    createdAt: '2026.11.06 09:45',
  },
  {
    id: 6,
    boardType: 'INQUIRY',
    userId: 11,
    nickname: '버그사냥꾼',
    userRole: 'USER',
    userStatus: 'ACTIVE',
    title: '타이니앱 등록 시 GitHub 레포 진입 HTML 경로(entry_path) 관련 문의드립니다',
    content: `안녕하세요! Vite + React로 타이니앱을 빌드해서 GitHub 레포지토리에 올렸습니다.

루트 폴더가 아니라 \`dist/index.html\` 안에 빌드 결과물이 들어가 있는데, 앱 등록 화면에서 진입 HTML 경로를 \`dist/index.html\`로 적으면 에셋 상대 경로(\`./assets/...\`)도 함께 정상 서빙되는지 궁금합니다.`,
    views: 145,
    commentCount: 2,
    isAnswered: true,
    createdAt: '2026.11.05 18:10',
  },
  {
    id: 5,
    boardType: 'INQUIRY',
    userId: 1,
    nickname: '코딩꿈나무',
    userRole: 'USER',
    userStatus: 'ACTIVE',
    title: '모바일 브라우저에서 전체화면 모드 전환 시 가로 고정 지원 예정이 있나요?',
    content: `PC에서는 16:10 모달과 레터박스 전체화면이 아주 깔끔하게 잘 나오는데, 태블릿이나 모바일에서 실행할 때 화면 회전 안내가 있으면 더 편할 것 같아 문의 남깁니다!`,
    views: 84,
    commentCount: 0,
    isAnswered: false,
    createdAt: '2026.11.05 14:05',
  },
  {
    id: 4,
    boardType: 'FREE',
    userId: 12,
    nickname: '알고리즘장인',
    userRole: 'USER',
    userStatus: 'ACTIVE',
    title: 'SQL 광부 게임에서 LEFT JOIN 보석 캘 때 시간 아끼는 단축키 조합',
    content: `SQL 광부 게임 은근히 손가락 피지컬 게임이네요 ㅋㅋㅋ

### 단축키 팁
- 숫자키 \`1~4\`로 테이블 블록을 먼저 찍고 스페이스바를 누르면 마우스 드래그보다 0.5초 이상 빠릅니다.
- \`WHERE IS NOT NULL\` 필터 아이템은 3라운드까지 아껴두세요!`,
    views: 220,
    commentCount: 1,
    createdAt: '2026.11.04 15:40',
  },
  {
    id: 3,
    boardType: 'FREE',
    userId: 13,
    nickname: '탈퇴한 유저',
    userRole: 'USER',
    userStatus: 'WITHDRAWN',
    title: '비전공자 입장에서 게임으로 조건문·반복문 배우니까 확실히 덜 지루하네요',
    content: `책으로만 문법 볼 때는 반복문이 머리에 잘 안 들어왔는데, 슬라임 던전이랑 바이너리 스네이크 하면서 점수 올리려고 발악하다 보니 자연스럽게 이해됐습니다. 다들 화이팅하세요!`,
    views: 167,
    commentCount: 1,
    createdAt: '2026.11.03 20:15',
  },
  {
    id: 2,
    boardType: 'INQUIRY',
    userId: 14,
    nickname: '파이썬조아',
    userRole: 'USER',
    userStatus: 'ACTIVE',
    title: '내가 등록한 앱의 레포지토리에 새 커밋을 푸시했는데 게임에 반영이 안 돼요',
    content: `버그 수정해서 GitHub 레포 \`main\` 브랜치에 새로 푸시했는데, 오락실 화면에서 실행해보니 이전 버전 그대로 나옵니다. 자동 동기화가 아닌가요?`,
    views: 132,
    commentCount: 1,
    isAnswered: true,
    createdAt: '2026.11.02 11:30',
  },
  {
    id: 1,
    boardType: 'FAQ',
    userId: 999,
    nickname: '관리자허',
    userRole: 'ADMIN',
    userStatus: 'ACTIVE',
    title: '앱 추천·비추천 버튼이 비활성화되어 있어요. 어떻게 투표하나요?',
    content: `TinyArcade의 추천·비추천은 단순 인기투표가 아니라 **"실제 플레이해 본 유저의 학습 유용성 평가"**입니다.

## 투표 자격 조건
- 해당 타이니앱을 **1회 이상 끝까지 플레이하여 점수 제출(SUBMITTED)을 완료한 회원**만 추천·비추천 버튼을 누를 수 있습니다.
- 같은 버튼을 다시 누르면 취소되며, 반대 버튼을 누르면 즉시 전환됩니다.`,
    views: 410,
    commentCount: 0,
    createdAt: '2026.11.01 09:00',
  },
]

export const MOCK_POST_COMMENTS_BY_ID: Record<number, CommentItem[]> = {
  10: [
    {
      id: 1001,
      targetType: 'POST',
      targetId: 10,
      userId: 14,
      nickname: '파이썬조아',
      userStatus: 'ACTIVE',
      content: '시간 단축형 게임 환산 공식 예시 코드 덕분에 바로 이해됐습니다! 감사합니다.',
      createdAt: '2일 전',
      replies: [
        {
          id: 1002,
          parentId: 1001,
          userId: 999,
          nickname: '관리자허',
          userStatus: 'ACTIVE',
          isAdmin: true,
          content: '도움이 되셨다니 다행입니다! 멋진 타이니앱 등록 기대할게요 :)',
          createdAt: '2일 전',
        },
      ],
    },
  ],
  9: [
    {
      id: 901,
      targetType: 'POST',
      targetId: 9,
      userId: 12,
      nickname: '알고리즘장인',
      userStatus: 'ACTIVE',
      content: '제 기록에 검증 중 배지가 떠서 깜짝 놀랐는데 치트가 아니면 마감 때 자동 인정되는군요!',
      createdAt: '1일 전',
      replies: [],
    },
  ],
  8: [
    {
      id: 801,
      targetType: 'POST',
      targetId: 8,
      userId: 11,
      nickname: '버그사냥꾼',
      userStatus: 'ACTIVE',
      rankBadge: '주간 2위',
      content: '아 1스테이지 보너스 상자를 버려야 2,800점대가 나오는 거였군요!! 오늘 밤에 바로 1위 탈환하러 갑니다 ㄷㄷ',
      createdAt: '2시간 전',
      replies: [
        {
          id: 802,
          parentId: 801,
          userId: 10,
          nickname: '코딩마스터',
          userStatus: 'ACTIVE',
          content: 'ㅋㅋㅋ 언제든 환영입니다! 저는 3,000점 루트 연구 중입니다!',
          createdAt: '1시간 전',
        },
      ],
    },
    {
      id: 803,
      targetType: 'POST',
      targetId: 8,
      userId: 13,
      nickname: '탈퇴한 유저',
      userStatus: 'WITHDRAWN',
      content: '체인 라이트닝 팁 진짜 유용하네요. 덕분에 1,800점 넘겼습니다.',
      createdAt: '45분 전',
      replies: [],
    },
  ],
  7: [
    {
      id: 701,
      targetType: 'POST',
      targetId: 7,
      userId: 10,
      nickname: '코딩마스터',
      userStatus: 'ACTIVE',
      content: '오 정규식 디펜스라니 주제 엄청 신선하네요! 승인 나면 바로 플레이해볼게요!',
      createdAt: '1시간 전',
      replies: [
        {
          id: 702,
          parentId: 701,
          userId: 1,
          nickname: '코딩꿈나무',
          userStatus: 'ACTIVE',
          content: '감사합니다 코딩마스터님!! 1등 기록 깨러 와주세요 ㅎㅎ',
          createdAt: '30분 전',
        },
      ],
    },
  ],
  6: [
    {
      id: 601,
      targetType: 'POST',
      targetId: 6,
      userId: 999,
      nickname: '관리자허',
      userStatus: 'ACTIVE',
      isAdmin: true,
      content:
        '안녕하세요, 버그사냥꾼님! 네, 진입 HTML 경로를 dist/index.html로 지정하시고 Vite 설정에서 base: "./" (상대 경로)로 빌드해 올려주시면 정적 에셋까지 모두 정상 서빙됩니다. 자세한 설정은 [따라해보세요] 가이드를 참고해 주세요!',
      createdAt: '어제',
      replies: [
        {
          id: 602,
          parentId: 601,
          userId: 11,
          nickname: '버그사냥꾼',
          userStatus: 'ACTIVE',
          content: '빠른 답변 감사합니다! base: "./" 추가해서 바로 등록 성공했습니다!',
          createdAt: '어제',
        },
      ],
    },
  ],
  2: [
    {
      id: 2001,
      targetType: 'POST',
      targetId: 2,
      userId: 999,
      nickname: '관리자허',
      userStatus: 'ACTIVE',
      isAdmin: true,
      content:
        '안녕하세요! MVP 정책상 앱 등록 시점의 커밋(commit_sha)으로 정적 파일이 고정 배포됩니다. 따라서 이후 레포에 새 커밋을 푸시하더라도 기존 앱에는 자동 반영되지 않으며, 수정본은 새로 등록해 주셔야 합니다.',
      createdAt: '2일 전',
      replies: [],
    },
  ],
}

// 프론트엔드 세션 동안 글 작성/수정/삭제 및 댓글 변경사항을 유지하는 인메모리 스토어
let sessionPosts: PostItem[] = [...MOCK_POST_LIST]
const sessionPostComments: Record<number, CommentItem[]> = { ...MOCK_POST_COMMENTS_BY_ID }

export function getBoardPosts(): PostItem[] {
  return sessionPosts
}

export function getBoardPostById(postId: number): PostItem | undefined {
  return sessionPosts.find((p) => p.id === postId)
}

export function incrementBoardPostViews(postId: number): PostItem | undefined {
  sessionPosts = sessionPosts.map((p) =>
    p.id === postId ? { ...p, views: p.views + 1 } : p,
  )
  return sessionPosts.find((p) => p.id === postId)
}

export function createBoardPost(input: {
  boardType: BoardType
  userId: number
  nickname: string
  userRole: UserRole
  userStatus: UserStatus
  title: string
  content: string
}): PostItem {
  const nextId = sessionPosts.reduce((max, p) => Math.max(max, p.id), 0) + 1
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const formattedNow = `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`

  const newPost: PostItem = {
    id: nextId,
    boardType: input.boardType,
    userId: input.userId,
    nickname: input.nickname,
    userRole: input.userRole,
    userStatus: input.userStatus,
    title: input.title,
    content: input.content,
    views: 1,
    commentCount: 0,
    isAnswered: input.boardType === 'INQUIRY' ? false : undefined,
    isPinned: input.boardType === 'FAQ',
    createdAt: formattedNow,
  }
  sessionPosts = [newPost, ...sessionPosts]
  sessionPostComments[nextId] = []
  return newPost
}

export function updateBoardPost(
  postId: number,
  input: { boardType: BoardType; title: string; content: string },
): PostItem | undefined {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const formattedNow = `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`

  sessionPosts = sessionPosts.map((p) =>
    p.id === postId
      ? {
          ...p,
          boardType: input.boardType,
          title: input.title,
          content: input.content,
          updatedAt: formattedNow,
        }
      : p,
  )
  return sessionPosts.find((p) => p.id === postId)
}

export function deleteBoardPost(postId: number): void {
  sessionPosts = sessionPosts.filter((p) => p.id !== postId)
  delete sessionPostComments[postId]
}

export function getPostCommentsById(postId: number): CommentItem[] {
  return sessionPostComments[postId] ?? []
}

export function syncPostCommentsById(postId: number, comments: CommentItem[]): void {
  sessionPostComments[postId] = comments
  const totalCount = comments.reduce(
    (sum, item) => sum + 1 + (item.replies ? item.replies.length : 0),
    0,
  )
  const hasAdminReply = comments.some(
    (c) => c.isAdmin || c.replies?.some((r) => r.isAdmin),
  )
  sessionPosts = sessionPosts.map((p) =>
    p.id === postId
      ? {
          ...p,
          commentCount: totalCount,
          isAnswered: p.boardType === 'INQUIRY' ? hasAdminReply || p.isAnswered : p.isAnswered,
        }
      : p,
  )
}
