import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../features/auth/useAuth'
import { getBoardPosts } from '../../mocks'
import type { BoardType, PostItem } from '../../types'

type BoardFilterType = 'ALL' | BoardType
type BoardSortType = 'LATEST' | 'COMMENTS'

export function BoardListPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated, isAdmin } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const initialTab = (searchParams.get('tab') as BoardFilterType) || 'ALL'
  const [activeTab, setActiveTab] = useState<BoardFilterType>(
    initialTab === 'FREE' || initialTab === 'INQUIRY' || initialTab === 'FAQ'
      ? initialTab
      : 'ALL',
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<BoardSortType>('LATEST')
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [adminOnlyNoticeOpen, setAdminOnlyNoticeOpen] = useState(false)

  const allPosts = getBoardPosts()

  const counts = useMemo(() => {
    return {
      ALL: allPosts.length,
      FREE: allPosts.filter((p) => p.boardType === 'FREE').length,
      INQUIRY: allPosts.filter((p) => p.boardType === 'INQUIRY').length,
      FAQ: allPosts.filter((p) => p.boardType === 'FAQ').length,
    }
  }, [allPosts])

  const filteredPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()

    return allPosts
      .filter((post) => {
        if (activeTab !== 'ALL' && post.boardType !== activeTab) return false
        if (q) {
          const authorName =
            post.userStatus === 'WITHDRAWN' ? '탈퇴한 유저' : post.nickname
          const hay = `${post.title} ${post.content} ${authorName}`.toLowerCase()
          if (!hay.includes(q)) return false
        }
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'LATEST' && activeTab === 'ALL') {
          if (a.isPinned && !b.isPinned) return -1
          if (!a.isPinned && b.isPinned) return 1
        }
        if (sortBy === 'COMMENTS') return b.commentCount - a.commentCount
        return b.id - a.id
      })
  }, [allPosts, activeTab, searchQuery, sortBy])

  const handleTabChange = (nextTab: BoardFilterType) => {
    setActiveTab(nextTab)
    if (nextTab === 'ALL') {
      setSearchParams({})
    } else {
      setSearchParams({ tab: nextTab })
    }
  }

  const handleWriteClick = () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true)
      return
    }
    if (activeTab === 'FAQ' && !isAdmin) {
      setAdminOnlyNoticeOpen(true)
      return
    }
    const defaultType =
      activeTab === 'ALL' ? 'FREE' : activeTab === 'FAQ' && !isAdmin ? 'FREE' : activeTab
    navigate(`/board/write?type=${defaultType}`)
  }

  // 작고 옅은 단색 뱃지 (빨강·주황 배제, 세 종류 구분)
  const renderBoardBadge = (post: PostItem) => {
    if (post.boardType === 'FAQ') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-warm-200/80 text-warm-800 shrink-0">
          FAQ
        </span>
      )
    }
    if (post.boardType === 'INQUIRY') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 shrink-0">
          문의
        </span>
      )
    }
    return (
      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-warm-100 text-warm-600 shrink-0">
        자유
      </span>
    )
  }

  const showWriteButton = activeTab !== 'FAQ' || isAdmin

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* 상단 커뮤니티 타이틀 */}
      <div className="px-1">
        <h1 className="font-display font-extrabold text-2xl text-warm-900 tracking-tight">
          오락실 커뮤니티
        </h1>
        <p className="text-xs sm:text-sm text-warm-500 mt-1">
          코딩학습·바이브코딩 자유 이야기부터 서비스 이용 문의, 자주 묻는 질문(FAQ)까지 확인하세요.
        </p>
      </div>

      {/* 탭·검색·정렬·글쓰기 + 게시글 목록 통합 상자 */}
      <section className="bg-white border border-warm-200 rounded-2xl shadow-warm-card overflow-hidden">
        {/* 상단 컨트롤 바: 맨 위 탭 줄 + 우측 검색·정렬·글쓰기 */}
        <div className="p-3 sm:p-4 border-b border-warm-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* 게시판 종류 탭 (이모지 제거, 선택된 탭에만 브랜드 주황색 사용) */}
          <div className="flex flex-wrap rounded-xl bg-warm-100 p-1 text-xs font-bold gap-1">
            <button
              type="button"
              onClick={() => handleTabChange('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'ALL'
                  ? 'bg-arcade-coral text-white shadow-xs'
                  : 'text-warm-600 hover:text-warm-900'
              }`}
            >
              전체 ({counts.ALL})
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('FREE')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'FREE'
                  ? 'bg-arcade-coral text-white shadow-xs'
                  : 'text-warm-600 hover:text-warm-900'
              }`}
            >
              자유게시판 ({counts.FREE})
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('INQUIRY')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'INQUIRY'
                  ? 'bg-arcade-coral text-white shadow-xs'
                  : 'text-warm-600 hover:text-warm-900'
              }`}
            >
              문의게시판 ({counts.INQUIRY})
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('FAQ')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'FAQ'
                  ? 'bg-arcade-coral text-white shadow-xs'
                  : 'text-warm-600 hover:text-warm-900'
              }`}
            >
              FAQ ({counts.FAQ})
            </button>
          </div>

          {/* 검색창 · 정렬 · 글쓰기 버튼 (검색창 오른쪽 배치, FAQ 탭에서는 관리자만 노출) */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-48">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="검색어 입력..."
                className="w-full bg-warm-50 border border-warm-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-warm-800 placeholder-warm-400 focus:outline-none focus:bg-white focus:border-warm-400 transition-all"
              />
              <svg
                className="w-3.5 h-3.5 text-warm-400 absolute left-2.5 top-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as BoardSortType)}
              className="bg-warm-50 border border-warm-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-warm-700 focus:outline-none focus:border-warm-400 shrink-0"
            >
              <option value="LATEST">최신순</option>
              <option value="COMMENTS">댓글순</option>
            </select>

            {showWriteButton && (
              <button
                type="button"
                onClick={handleWriteClick}
                className="px-3.5 py-1.5 rounded-xl bg-arcade-coral hover:bg-arcade-coralHover text-white font-display font-bold text-xs transition-all shrink-0 active:scale-95"
              >
                {activeTab === 'FAQ' ? 'FAQ 등록' : '글쓰기'}
              </button>
            )}
          </div>
        </div>

        {/* 게시글 목록 (얇은 1px 회색 구분선, 카드 테두리/배경색/둥근 모서리 제거) */}
        {filteredPosts.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-2">
            <div className="font-display font-bold text-sm text-warm-700">
              등록된 게시글이 없습니다.
            </div>
            <p className="text-xs text-warm-400">
              다른 검색어를 입력하거나 새 게시글을 작성해 보세요.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-warm-200">
            {filteredPosts.map((post) => {
              const isWithdrawn = post.userStatus === 'WITHDRAWN'
              const isMyPost = user?.id === post.userId
              const formattedNum = `#${String(post.id).padStart(2, '0')}`

              return (
                <div
                  key={post.id}
                  onClick={() => navigate(`/board/${post.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      navigate(`/board/${post.id}`)
                    }
                  }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4 px-4 py-2.5 hover:bg-warm-50 transition-colors cursor-pointer"
                >
                  {/* 좌측: 번호 · 뱃지 · 답변상태(글자색만) · 제목 · 댓글수(회색 숫자만) */}
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="font-mono text-xs text-warm-400 w-7 shrink-0">
                      {formattedNum}
                    </span>

                    {renderBoardBadge(post)}

                    {post.boardType === 'INQUIRY' && (
                      <span
                        className={`text-xs font-semibold shrink-0 ${
                          post.isAnswered ? 'text-emerald-600' : 'text-warm-400'
                        }`}
                      >
                        {post.isAnswered ? '답변완료' : '답변대기'}
                      </span>
                    )}

                    <span className="text-sm font-medium text-warm-900 truncate">
                      {post.title}
                    </span>

                    {post.boardType !== 'FAQ' && post.commentCount > 0 && (
                      <span className="text-xs font-mono text-warm-400 shrink-0">
                        {post.commentCount}
                      </span>
                    )}
                  </div>

                  {/* 우측: 작성자(회색 테두리 운영진 뱃지) · 날짜 */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 text-xs shrink-0 pl-9 sm:pl-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={
                          isWithdrawn
                            ? 'text-warm-400'
                            : isMyPost
                              ? 'font-semibold text-warm-900'
                              : 'text-warm-600'
                        }
                      >
                        {isWithdrawn
                          ? '탈퇴한 유저'
                          : isMyPost
                            ? `${post.nickname} (나)`
                            : post.nickname}
                      </span>
                      {!isWithdrawn && post.userRole === 'ADMIN' && (
                        <span className="px-1.5 py-0.5 rounded border border-warm-300 text-warm-500 text-[10px] font-medium">
                          운영진
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] font-mono text-warm-400">
                      {post.createdAt.split(' ')[0]}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* 비로그인 글쓰기 클릭 시 확인 모달 (Zero Alert/Confirm) */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-warm-900/60 backdrop-blur-sm">
          <div className="bg-white border border-warm-200 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="space-y-1">
              <span className="text-[11px] font-mono font-bold text-arcade-coral uppercase tracking-wider">
                AUTHORIZATION REQUIRED
              </span>
              <h3 className="font-display font-bold text-lg text-warm-900">
                로그인이 필요한 기능입니다
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-warm-600 leading-relaxed">
              커뮤니티 게시글 작성은 로그인한 회원만 이용할 수 있습니다. 로그인 페이지로 이동하시겠습니까?
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setAuthModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-warm-100 hover:bg-warm-200 text-xs text-warm-700 font-bold transition-colors"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthModalOpen(false)
                  navigate('/login')
                }}
                className="px-4 py-2.5 rounded-xl bg-arcade-coral hover:bg-arcade-coralHover text-xs text-white font-bold transition-colors shadow-sm"
              >
                로그인하러 가기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 일반 유저가 FAQ 탭에서 등록 클릭 시 안내 모달 */}
      {adminOnlyNoticeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-warm-900/60 backdrop-blur-sm">
          <div className="bg-white border border-warm-200 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="space-y-1">
              <span className="text-[11px] font-mono font-bold text-arcade-coral uppercase tracking-wider">
                ADMIN ONLY
              </span>
              <h3 className="font-display font-bold text-lg text-warm-900">
                FAQ는 관리자만 작성할 수 있습니다
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-warm-600 leading-relaxed">
              자주 묻는 질문(FAQ)은 운영진 전용 게시판입니다. 궁금하신 점은 <strong>문의게시판</strong>에 남겨주시면 운영진이 댓글로 답변해 드립니다!
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setAdminOnlyNoticeOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-warm-100 hover:bg-warm-200 text-xs text-warm-700 font-bold transition-colors"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdminOnlyNoticeOpen(false)
                  navigate('/board/write?type=INQUIRY')
                }}
                className="px-4 py-2.5 rounded-xl bg-arcade-coral hover:bg-arcade-coralHover text-xs text-white font-bold transition-colors shadow-sm"
              >
                문의게시판에 글쓰기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
