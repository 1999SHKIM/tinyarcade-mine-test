import { MOCK_APP_LIST } from '../../mocks'
import type { TinyApp } from '../../types'

// [참고] 홈에 "정비중"으로 보여 줄 예전 시안 게임 5개 (공식 3, 유저 2). 서버에는 없는 앱이다.
// - MOCK_APP_LIST 첫 칸이 이미 코드 퀘스트(MOCK_APP_DETAIL)라서 따로 더하지 않는다(더하면 두 번 나옴).
// - 카드 그리는 파일(MaintenanceAppCard.tsx)과 나눈 이유: 컴포넌트 파일이 값도 함께 내보내면
//   개발 서버의 빠른 새로고침(Fast Refresh)이 잘 동작하지 않는다(oxlint only-export-components).
export const MAINTENANCE_APPS: TinyApp[] = MOCK_APP_LIST
