import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { deletePost, getPost, getPosts } from '../../api/board'
import { getErrorMessage } from '../../api/client'
import { useAuth } from '../../features/auth/useAuth'
import { CommentSection } from '../../features/comments/CommentSection'
import type { BoardType, PostItem } from '../../types'
import { PostContentRenderer } from './PostContentRenderer'

function getBoardBadgeInfo(boardType: BoardType) {
  if (boardType === 'FAQ') {
    return {
      label: '📌 FAQ 공식 안내',
      className: 'bg-rose-50 text-arcade-coral border-rose-200',
    }
  }
  if (boardType === 'INQUIRY') {
    return {
      label: '🛠️ 문의게시판',
      className: 'bg-amber-50 text-amber-800 border-amber-200',
    }
  }
  return {
    label: '🗣️ 자유게시판',
    className: 'bg-warm-100 text-warm-700 border-warm-200',
  }
}

export function PostDetailPage() {
  const { postId } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated, isAdmin } = useAuth()

  const numericId = Number(postId)
  const [post, setPost] = useState<PostItem | null>(null)
  const [allPosts, setAllPosts] = useState<PostItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState<{
    message: string
    type: 'info' | 'success' | 'warn'
  } | null>(null)

  const showToast = (message: string, type: 'info' | 'success' | 'warn' = 'info') => {
    setToast({ message, type })
    window.setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev))
    }, 3000)
  }

  useEffect(() => {
    if (!Number.isFinite(numericId) || numericId <= 0) {
      setPost(null)
      setLoading(false)
      return
    }
    let mounted = true
    setLoading(true)
    Promise.all([getPost(numericId), getPosts().catch(() => [] as PostItem[])])
      .then(([detail, list]) => {
        if (!mounted) return
        setPost(detail)
        setAllPosts(list)
      })
      .catch(() => {
        if (mounted) setPost(null)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [numericId])

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto rounded-3xl bg-white border border-warm-200 p-10 sm:p-14 text-center shadow-warm-card text-xs sm:text-sm text-warm-400">
        게시글을 불러오는 중입니다...
      </div>
    )
  }

  if (!post) {
    return (
      <div className="max-w-5xl mx-auto rounded-3xl bg-white border border-warm-200 p-10 sm:p-14 text-center shadow-warm-card space-y-4">
        <div className="text-4xl">🔍</div>
        <div className="space-y-1.5">
          <h1 className="font-display font-extrabold text-xl text-warm-900">
            게시글을 찾을 수 없습니다
          </h1>
          <p className="text-xs sm:text-sm text-warm-500">
            삭제되었거나 존재하지 않는 게시글 번호입니다.
          </p>
        </div>
        <div className="pt-2">
          <Link
            to="/board"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-warm-900 text-white text-xs sm:text-sm font-bold hover:bg-warm-800 transition-all"
          >
            ← 커뮤니티 목록으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  const currentIndex = allPosts.findIndex((p) => p.id === post.id)
  const prevPost =
    currentIndex >= 0 && currentIndex < allPosts.length - 1
      ? allPosts[currentIndex + 1]
      : null
  const nextPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null

  const badge = getBoardBadgeInfo(post.boardType)
  const isWithdrawn = post.userStatus === 'WITHDRAWN'
  const isOwner = Boolean(user && user.id === post.userId)
  const canDelete = Boolean(user && (isOwner || isAdmin))

  const handleConfirmDelete = async () => {
    setDeleting(true)
    try {
      await deletePost(post.id)
      setIsDeleteModalOpen(false)
      navigate('/board', { replace: true })
    } catch (err) {
      setIsDeleteModalOpen(false)
      showToast(getErrorMessage(err, '게시글 삭제에 실패했습니다.'), 'warn')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/board"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-warm-600 hover:text-warm-900 transition-colors"
        >
          <span>←</span>
          <span>게시판 목록으로</span>
        </Link>

        {(isOwner || canDelete) && (
          <div className="flex items-center gap-2">
            {isOwner && (
              <Link
                to={`/board/${post.id}/edit`}
                className="px-3.5 py-1.5 rounded-xl bg-white border border-warm-200 text-xs font-bold text-warm-700 hover:bg-warm-50 hover:border-warm-300 transition-all"
              >
                수정하기
              </Link>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-600 hover:bg-rose-100 transition-all"
              >
                삭제
              </button>
            )}
          </div>
        )}
      </div>

      {/* Inline Toast Feedback (Zero Alert) */}
      {toast && (
        <div
          className={`flex items-center justify-between px-4 py-3 rounded-2xl border text-xs sm:text-sm font-semibold shadow-sm transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : toast.type === 'warn'
                ? 'bg-rose-50 border-rose-200 text-rose-700'
                : 'bg-warm-900 border-warm-800 text-white'
          }`}
        >
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-xs opacity-70 hover:opacity-100 ml-3"
          >
            닫기
          </button>
        </div>
      )}

      {/* Main Article Card */}
      <article className="rounded-3xl bg-white border border-warm-200 shadow-warm-card overflow-hidden">
        {/* Post Header */}
        <header className="p-6 sm:p-8 border-b border-warm-100 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${badge.className}`}
              >
                {badge.label}
              </span>

              {post.boardType === 'INQUIRY' && (
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${
                    post.isAnswered
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-warm-100 text-warm-500 border-warm-200'
                  }`}
                >
                  {post.isAnswered ? '✓ 운영진 답변 완료' : '답변 대기 중'}
                </span>
              )}
            </div>

            <span className="font-mono text-xs text-warm-400">#{post.id}</span>
          </div>

          <h1 className="font-display font-extrabold text-xl sm:text-2xl text-warm-900 leading-snug">
            {post.title}
          </h1>

          {/* Author & Timestamp Meta */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs text-warm-500">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-display font-bold text-xs ${
                  post.userRole === 'ADMIN'
                    ? 'bg-warm-900 text-white'
                    : isWithdrawn
                      ? 'bg-warm-200 text-warm-500'
                      : 'bg-rose-50 text-arcade-coral border border-rose-200'
                }`}
              >
                {isWithdrawn ? '?' : post.nickname.slice(0, 1)}
              </div>
              <span
                className={`font-semibold ${
                  isWithdrawn ? 'text-warm-400' : 'text-warm-800'
                }`}
              >
                {isWithdrawn
                  ? '탈퇴한 유저'
                  : isOwner
                    ? `${post.nickname} (나)`
                    : post.nickname}
              </span>
              {post.userRole === 'ADMIN' && (
                <span className="px-1.5 py-0.5 rounded bg-warm-900 text-white text-[10px] font-bold">
                  운영진
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 font-mono text-[11px] text-warm-400">
              <span>작성 {post.createdAt}</span>
              {post.updatedAt && <span>· 수정됨 ({post.updatedAt})</span>}
            </div>
          </div>
        </header>

        {/* Post Body */}
        <div className="p-6 sm:p-8">
          <PostContentRenderer content={post.content} />
        </div>
      </article>

      {/* Comments Section: 메인 스펙 §7에 따라 FAQ는 글만 지원하고 자유/문의게시판에만 댓글·대댓글 표시 */}
      {post.boardType === 'FAQ' ? (
        <div className="rounded-2xl bg-warm-100/80 border border-warm-200 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-warm-600">
          <div className="flex items-center gap-2">
            <span className="text-base">📌</span>
            <span>
              <strong>FAQ 공식 안내 문서</strong>는 댓글이 지원되지 않습니다. 추가 질문이 있다면 문의게시판을 이용해 주세요.
            </span>
          </div>
          {isAuthenticated ? (
            <Link
              to="/board/write?type=INQUIRY"
              className="shrink-0 inline-flex items-center justify-center px-3.5 py-2 rounded-xl bg-white border border-warm-200 font-bold text-warm-800 hover:border-arcade-coral hover:text-arcade-coral transition-colors"
            >
              🛠️ 문의글 작성하기
            </Link>
          ) : (
            <Link
              to="/login"
              className="shrink-0 inline-flex items-center justify-center px-3.5 py-2 rounded-xl bg-white border border-warm-200 font-bold text-warm-800 hover:border-arcade-coral hover:text-arcade-coral transition-colors"
            >
              로그인 후 문의하기
            </Link>
          )}
        </div>
      ) : (
        <CommentSection
          targetType="POST"
          targetId={post.id}
          onNotify={showToast}
          onCommentsChange={(total) => {
            setPost((prev) => (prev ? { ...prev, commentCount: total } : prev))
          }}
        />
      )}

      {/* Prev / Next Post Navigation */}
      <div className="rounded-3xl bg-white border border-warm-200 divide-y divide-warm-100 overflow-hidden shadow-warm-card text-xs sm:text-sm">
        {nextPost && (
          <Link
            to={`/board/${nextPost.id}`}
            className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-warm-50/70 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="shrink-0 font-mono text-[11px] font-bold text-warm-400">
                ↑ 다음글
              </span>
              <span className="font-semibold text-warm-800 truncate">
                {nextPost.title}
              </span>
            </div>
            <span className="shrink-0 font-mono text-[11px] text-warm-400">
              {nextPost.createdAt.split(' ')[0]}
            </span>
          </Link>
        )}
        {prevPost && (
          <Link
            to={`/board/${prevPost.id}`}
            className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-warm-50/70 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="shrink-0 font-mono text-[11px] font-bold text-warm-400">
                ↓ 이전글
              </span>
              <span className="font-semibold text-warm-800 truncate">
                {prevPost.title}
              </span>
            </div>
            <span className="shrink-0 font-mono text-[11px] text-warm-400">
              {prevPost.createdAt.split(' ')[0]}
            </span>
          </Link>
        )}
      </div>

      {/* Custom Delete Confirmation Modal (Zero Alert/Confirm) */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-warm-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white border border-warm-200 p-6 sm:p-7 shadow-xl space-y-5">
            <div className="space-y-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 text-xs font-bold">
                삭제 확인
              </span>
              <h2 className="font-display font-extrabold text-lg text-warm-900">
                이 게시글을 삭제하시겠습니까?
              </h2>
              <p className="text-xs sm:text-sm text-warm-500 leading-relaxed">
                삭제한 게시글과 댓글은 복구할 수 없습니다. 계속 진행하시겠습니까?
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-warm-100 text-warm-700 text-xs sm:text-sm font-bold hover:bg-warm-200 transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2.5 rounded-xl bg-rose-600 text-white text-xs sm:text-sm font-bold hover:bg-rose-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {deleting ? '삭제 중...' : '게시글 삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
