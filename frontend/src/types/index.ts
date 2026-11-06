export type UserRole = 'USER' | 'ADMIN'
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'WITHDRAWN'

export interface User {
  id: number
  email: string
  nickname: string
  role: UserRole
  status: UserStatus
}

export type AppStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface TinyApp {
  id: number
  creatorId: number
  creatorNickname?: string
  title: string
  description: string
  repoUrl: string
  commitSha?: string
  entryPath: string
  deployKey?: string
  status: AppStatus
  rejectReason?: string | null
  isOfficial: boolean
  isMock?: boolean
  maxScore?: number | null
  recommendCount: number
  notRecommendCount: number
  playCount: number
  createdAt: string
}

export type BoardType = 'FREE' | 'INQUIRY' | 'FAQ'
export type CommentTargetType = 'POST' | 'APP' | 'RANKING'
export type VoteType = 'RECOMMEND' | 'NOT_RECOMMEND'
export type VerifyStatus = 'NORMAL' | 'PENDING' | 'APPROVED'
