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

  const renderBoardBadge = (post: PostItem) => {
    if (post.boardType === 'FAQ') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-arcade-coral border border-rose-100 shrink-0">
          FAQ
        </span>
      )
    }
    if (post.boardType === 'INQUIRY') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
          문의
        </span>
      )
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-warm-200/70 text-warm-700 border border-warm-200 shrink-0">
        자유
      </span>
    )
  }

  return (
    <div className="space-y-5">
      {/* 상단 커뮤니티 헤더 바 */}
      <section className="bg-white border border-warm-200 rounded-3xl p-5 sm:p-6 shadow-warm-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">💬</span>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-warm-900 tracking-tight">
              오락실 커뮤니티
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-warm-500 mt-1">
            코딩학습·바이브코딩 자유 이야기부터 서비스 이용 문의, 자주 묻는 질문(FAQ)까지 확인하세요.
          </p>
        </div>

        <button
          type="button"
          onClick={handleWriteClick}
          className="px-5 py-3 rounded-2xl bg-arcade-coral hover:bg-arcade-coralHover text-white font-display font-bold text-sm shadow-btn-play transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span>{activeTab === 'FAQ' && isAdmin ? 'FAQ 등록하기' : '새 글 작성하기'}</span>
        </button>
      </section>

      {/* 필터 탭 & 검색·정렬 툴바 */}
      <section className="bg-white border border-warm-200 rounded-2xl p-3 sm:p-4 shadow-warm-card flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* 게시판 종류 탭 */}
        <div className="flex flex-wrap rounded-xl bg-warm-100 p-1 border border-warm-200 text-xs font-bold gap-1">
          <button
            type="button"
            onClick={() => handleTabChange('ALL')}
            className={`px-3.5 py-2 rounded-lg transition-all ${
              activeTab === 'ALL'
                ? 'bg-white text-warm-900 shadow-sm'
                : 'text-warm-500 hover:text-warm-800'
            }`}
          >
            전체 ({counts.ALL})
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('FREE')}
            className={`px-3.5 py-2 rounded-lg transition-all ${
              activeTab === 'FREE'
                ? 'bg-white text-warm-900 shadow-sm'
                : 'text-warm-500 hover:text-warm-800'
            }`}
          >
            🗣️ 자유게시판 ({counts.FREE})
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('INQUIRY')}
            className={`px-3.5 py-2 rounded-lg transition-all ${
              activeTab === 'INQUIRY'
                ? 'bg-white text-warm-900 shadow-sm'
                : 'text-warm-500 hover:text-warm-800'
            }`}
          >
            🛠️ 문의게시판 ({counts.INQUIRY})
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('FAQ')}
            className={`px-3.5 py-2 rounded-lg transition-all ${
              activeTab === 'FAQ'
                ? 'bg-white text-arcade-coral shadow-sm'
                : 'text-warm-500 hover:text-warm-800'
            }`}
          >
            📌 FAQ ({counts.FAQ})
          </button>
        </div>

        {/* 검색창 & 정렬 드롭다운 */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="제목, 내용, 작성자 검색..."
              className="w-full bg-warm-50 border border-warm-200 rounded-xl pl-9 pr-3 py-2 text-xs text-warm-800 placeholder-warm-400 focus:outline-none focus:bg-white focus:border-arcade-coral transition-all"
            />
            <svg
              className="w-4 h-4 text-warm-400 absolute left-3 top-2.5"
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
            className="bg-warm-50 border border-warm-200 rounded-xl px-3 py-2 text-xs font-bold text-warm-700 focus:outline-none focus:border-arcade-coral"
          >
            <option value="LATEST">최신순</option>
            <option value="COMMENTS">댓글순</option>
          </select>
        </div>
      </section>

      {/* 일반 게시판 목록형 리스트 (댓글·랭킹 행 디자인 계승, 본문 피드 요약 제거) */}
      <section className="bg-white border border-warm-200 rounded-3xl p-5 sm:p-6 shadow-warm-card space-y-4">
        <div className="flex items-center justify-between border-b border-warm-200 pb-3">
          <div className="flex items-center gap-2">
            <h2 className="font-display font-bold text-base sm:text-lg text-warm-900">
              {activeTab === 'ALL'
                ? '전체 게시글 목록'
                : activeTab === 'FREE'
                  ? '🗣️ 자유게시판'
                  : activeTab === 'INQUIRY'
                    ? '🛠️ 문의게시판'
                    : '📌 자주 묻는 질문 (FAQ)'}
            </h2>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-warm-100 text-warm-600 font-bold">
              {filteredPosts.length}
            </span>
          </div>
          <span className="text-xs text-warm-400 hidden sm:inline">
            {activeTab === 'FAQ'
              ? 'FAQ는 관리자만 작성하며 댓글이 없는 안내글입니다'
              : activeTab === 'INQUIRY'
                ? '문의에 대한 관리자 답변은 댓글로 등록됩니다'
                : '자유·문의(글+댓글) / FAQ(관리자 전용 글)'}
          </span>
        </div>

        {/* Empty State */}
        {filteredPosts.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-3 bg-warm-50 border border-warm-100 rounded-2xl">
            <div className="text-3xl">📭</div>
            <div className="font-display font-bold text-base text-warm-800">
              등록된 게시글이 없습니다.
            </div>
            <p className="text-xs text-warm-500">
              다른 검색어를 입력하거나 새 게시글을 작성해 보세요.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
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
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 px-4 py-3.5 rounded-2xl border transition-all cursor-pointer group ${
                    post.boardType === 'FAQ' && activeTab === 'ALL'
                      ? 'bg-rose-50/35 hover:bg-white border-rose-200/70 hover:border-arcade-coral hover:shadow-sm'
                      : 'bg-warm-50 hover:bg-white border-warm-100 hover:border-warm-300 hover:shadow-sm'
                  }`}
                >
                  {/* 좌측: 번호 + 게시판 배지 + 답변여부 + 제목 + 댓글수 */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="font-mono text-xs font-bold text-warm-400 w-8 shrink-0">
                      {formattedNum}
                    </span>

                    {renderBoardBadge(post)}

                    {post.boardType === 'INQUIRY' && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                          post.isAnswered
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-warm-100 text-warm-500 border-warm-200'
                        }`}
                      >
                        {post.isAnswered ? '답변완료' : '답변대기'}
                      </span>
                    )}

                    <span className="font-display font-bold text-sm text-warm-900 group-hover:text-arcade-coral transition-colors truncate">
                      {post.title}
                    </span>

                    {post.boardType !== 'FAQ' && post.commentCount > 0 && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-rose-50 border border-rose-100 text-[11px] font-mono font-bold text-arcade-coral shrink-0">
                        [{post.commentCount}]
                      </span>
                    )}
                  </div>

                  {/* 우측: 작성자(탈퇴한 유저/운영진 배지) + 작성일시 */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 text-xs shrink-0 pl-10 sm:pl-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`font-bold ${
                          isWithdrawn
                            ? 'text-warm-400'
                            : isMyPost
                              ? 'text-arcade-coral'
                              : 'text-warm-700'
                        }`}
                      >
                        {isWithdrawn
                          ? '탈퇴한 유저'
                          : isMyPost
                            ? `${post.nickname} (나)`
                            : post.nickname}
                      </span>
                      {!isWithdrawn && post.userRole === 'ADMIN' && (
                        <span className="px-1.5 py-0.5 rounded bg-warm-900 text-white text-[10px] font-bold">
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
