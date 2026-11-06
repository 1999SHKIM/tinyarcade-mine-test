export type UserRole = 'USER' | 'ADMIN'
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'WITHDRAWN'

export interface User {
  id: number
  email: string
  nickname: string
  role: UserRole
  status: UserStatus
  createdAt?: string // [김] 10번: GET /api/users/me 응답에 포함
}

export type AppStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface TinyApp {
  id: number
  creatorId: number
  creatorNickname?: string
  creatorHandle?: string
  categoryTag?: string
  bannerUrl?: string
  weeklyTopScore?: number
  weeklyParticipants?: number
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

export interface LeaderboardEntry {
  id: string
  rank: number
  userId: number
  nickname: string
  userStatus: UserStatus
  score: number
  submittedAt: string
  verifyStatus: VerifyStatus
  isMe?: boolean
}

export interface OverallRankingEntry {
  rank: number
  userId: number
  nickname: string
  handle: string
  totalPoints: number
  firstPlaceCount: number
  firstPlaceApps: string[]
  highlightNote?: string
  isMe?: boolean
}

export interface CommentReplyItem {
  id: number
  parentId: number
  userId: number
  nickname: string
  userStatus: UserStatus
  isCreator?: boolean
  content: string
  createdAt: string
}

export interface CommentItem {
  id: number
  targetType: CommentTargetType
  targetId: number | null
  userId: number
  nickname: string
  userStatus: UserStatus
  rankBadge?: string
  content: string
  createdAt: string
  replies?: CommentReplyItem[]
}
