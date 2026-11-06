import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../features/auth/useAuth'
import { getBoardPosts } from '../../mocks'
import type { BoardType, PostItem } from '../../types'

type BoardFilterType = 'ALL' | BoardType
type BoardSortType = 'LATEST' | 'VIEWS' | 'COMMENTS'

function stripMarkdownPreview(raw: string): string {
  return raw
    .replace(/```[\s\S]*?```/g, ' [코드 블록] ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^-\s+/gm, '• ')
    .replace(/\n+/g, ' ')
    .trim()
}

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
  const [visibleCount, setVisibleCount] = useState(6)
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
        // 전체/FAQ 탭에서는 고정(FAQ 필독) 글을 상단에 우선 노출 (최신순일 때)
        if (sortBy === 'LATEST' && activeTab === 'ALL') {
          if (a.isPinned && !b.isPinned) return -1
          if (!a.isPinned && b.isPinned) return 1
        }
        if (sortBy === 'VIEWS') return b.views - a.views
        if (sortBy === 'COMMENTS') return b.commentCount - a.commentCount
        return b.id - a.id
      })
  }, [allPosts, activeTab, searchQuery, sortBy])

  const visiblePosts = filteredPosts.slice(0, visibleCount)
  const hasMore = visibleCount < filteredPosts.length

  const handleTabChange = (nextTab: BoardFilterType) => {
    setActiveTab(nextTab)
    setVisibleCount(6)
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
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-arcade-coral border border-rose-100">
          📌 FAQ
        </span>
      )
    }
    if (post.boardType === 'INQUIRY') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          🛠️ 문의게시판
        </span>
      )
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-warm-200/70 text-warm-700 border border-warm-200">
        🗣️ 자유게시판
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
            게임 하이스코어 공략, 바이브코딩 제작 팁, 서비스 이용 문의 및 FAQ를 한곳에서 확인하세요.
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
            전체 보기 ({counts.ALL})
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
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setVisibleCount(6)
              }}
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
            <option value="VIEWS">조회수순</option>
            <option value="COMMENTS">댓글 많은 순</option>
          </select>
        </div>
      </section>

      {/* 게시글 리스트 컨테이너 (CommentSection의 카드·행 룩앤필 계승) */}
      <section className="bg-white border border-warm-200 rounded-3xl p-5 sm:p-6 shadow-warm-card space-y-4">
        <div className="flex items-center justify-between border-b border-warm-100 pb-3">
          <div className="flex items-center gap-2">
            <h2 className="font-display font-bold text-base sm:text-lg text-warm-900">
              {activeTab === 'ALL'
                ? '전체 게시글 피드'
                : activeTab === 'FREE'
                  ? '🗣️ 자유게시판'
                  : activeTab === 'INQUIRY'
                    ? '🛠️ 문의게시판 (전체 공개)'
                    : '📌 자주 묻는 질문 (FAQ)'}
            </h2>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-warm-100 text-warm-600 font-bold">
              {filteredPosts.length}
            </span>
          </div>
          <span className="text-xs text-warm-400 hidden sm:inline">
            {activeTab === 'FAQ'
              ? '운영진이 등록한 공식 안내 문서입니다'
              : activeTab === 'INQUIRY'
                ? '문의글에 대한 운영진 답변은 댓글로 등록됩니다'
                : '상호 존중하는 오락실 커뮤니티'}
          </span>
        </div>

        {/* Empty State */}
        {filteredPosts.length === 0 ? (
          <div className="py-14 px-4 text-center space-y-3 bg-warm-50 border border-warm-100 rounded-2xl">
            <div className="text-3xl">📭</div>
            <div className="font-display font-bold text-base text-warm-800">
              조건에 맞는 게시글이 없습니다.
            </div>
            <p className="text-xs text-warm-500">
              다른 검색어를 입력하거나 첫 번째 게시글의 주인공이 되어보세요!
            </p>
            {(activeTab !== 'FAQ' || isAdmin) && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleWriteClick}
                  className="px-4 py-2 rounded-xl bg-warm-900 hover:bg-warm-800 text-white text-xs font-bold transition-all"
                >
                  + 첫 게시글 작성하기
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {visiblePosts.map((post) => {
              const isWithdrawn = post.userStatus === 'WITHDRAWN'
              const isMyPost = user?.id === post.userId
              const formattedNum = `#${String(post.id).padStart(2, '0')}`

              return (
                <article
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
                  className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer group space-y-2.5 ${
                    post.isPinned && activeTab === 'ALL'
                      ? 'bg-rose-50/35 hover:bg-white border-rose-200/80 hover:border-arcade-coral hover:shadow-warm-card'
                      : 'bg-warm-50 hover:bg-white border-warm-100 hover:border-warm-300 hover:shadow-warm-card'
                  }`}
                >
                  {/* 상단 메타 라인: 글번호 + 게시판 배지 + 답변 상태 배지 + 날짜/조회수 */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-warm-400">{formattedNum}</span>
                      {renderBoardBadge(post)}

                      {post.boardType === 'INQUIRY' && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                            post.isAnswered
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-warm-100 text-warm-500 border-warm-200'
                          }`}
                        >
                          {post.isAnswered ? '✓ 답변 완료' : '답변 대기'}
                        </span>
                      )}

                      {post.isPinned && (
                        <span className="px-2 py-0.5 rounded-md bg-warm-900 text-white text-[10px] font-mono font-bold">
                          공지·필독
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] font-mono text-warm-400">
                      <span>조회 {post.views.toLocaleString()}</span>
                      <span>•</span>
                      <span>{post.createdAt}</span>
                    </div>
                  </div>

                  {/* 중단: 제목 + 댓글 수 + 본문 2줄 요약 */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display font-bold text-sm sm:text-base text-warm-900 group-hover:text-arcade-coral transition-colors">
                        {post.title}
                      </h3>
                      {post.commentCount > 0 && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-100 text-[11px] font-mono font-bold text-arcade-coral">
                          💬 {post.commentCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-warm-600 line-clamp-2 leading-relaxed">
                      {stripMarkdownPreview(post.content)}
                    </p>
                  </div>

                  {/* 하단: 작성자 정보 (댓글·대댓글 컴포넌트 스타일과 통일) */}
                  <div className="pt-2 border-t border-warm-200/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-bold ${
                          isWithdrawn
                            ? 'text-warm-400'
                            : isMyPost
                              ? 'text-arcade-coral'
                              : 'text-warm-800'
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

                    <span className="text-xs font-bold text-warm-400 group-hover:text-arcade-coral transition-colors">
                      게시글 읽기 →
                    </span>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {/* 하단 더보기 / 아카이브 끝 표시 */}
        {filteredPosts.length > 0 && (
          <div className="pt-2 flex flex-col items-center justify-center">
            {hasMore ? (
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + 6)}
                className="px-6 py-2.5 rounded-2xl bg-warm-100 hover:bg-warm-200 text-warm-800 text-xs font-bold transition-all border border-warm-200"
              >
                게시글 더보기 ({filteredPosts.length - visibleCount}건 남음) ↓
              </button>
            ) : (
              <div className="flex items-center gap-3 text-[11px] font-mono text-warm-400 py-2">
                <span className="w-12 h-px bg-warm-200" />
                <span>마지막 게시글입니다 (총 {filteredPosts.length}건)</span>
                <span className="w-12 h-px bg-warm-200" />
              </div>
            )}
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
