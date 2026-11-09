import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { createPost, getPost, updatePost } from '../../api/board'
import { getErrorMessage } from '../../api/client'
import { useAuth } from '../../features/auth/useAuth'
import type { BoardType, PostItem } from '../../types'
import { PostContentRenderer } from './PostContentRenderer'

const BOARD_TYPE_OPTIONS: {
  key: BoardType
  label: string
  badge: string
  desc: string
  adminOnly?: boolean
}[] = [
  {
    key: 'FREE',
    label: '자유게시판',
    badge: '🗣️',
    desc: '타이니앱 공략, 코딩 팁, 자유로운 소통 공간 (댓글·대댓글 지원)',
  },
  {
    key: 'INQUIRY',
    label: '문의게시판',
    badge: '🛠️',
    desc: '앱 등록, 리더보드, 버그 제보 및 운영진 답변 요청 (댓글·대댓글 지원)',
  },
  {
    key: 'FAQ',
    label: 'FAQ 공식 안내',
    badge: '📌',
    desc: '관리자 전용 공식 안내 및 자주 묻는 질문 문서 (글 전용 · 댓글 미지원)',
    adminOnly: true,
  },
]

export function PostEditPage() {
  const { postId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, isAuthenticated, isAdmin, isLoading: authLoading } = useAuth()

  const isEditMode = Boolean(postId)
  const numericId = Number(postId)

  const resolveInitialBoardType = (): BoardType => {
    const paramType = searchParams.get('type')
    if (paramType === 'INQUIRY') return 'INQUIRY'
    if (paramType === 'FAQ' && isAdmin) return 'FAQ'
    return 'FREE'
  }

  const [existingPost, setExistingPost] = useState<PostItem | null>(null)
  const [loadingPost, setLoadingPost] = useState<boolean>(isEditMode)
  const [boardType, setBoardType] = useState<BoardType>(resolveInitialBoardType)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [editorTab, setEditorTab] = useState<'WRITE' | 'PREVIEW'>('WRITE')

  const [titleError, setTitleError] = useState<string | null>(null)
  const [contentError, setContentError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false)

  const titleInputRef = useRef<HTMLInputElement | null>(null)
  const contentTextareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    if (!isEditMode) return
    if (!Number.isFinite(numericId) || numericId <= 0) {
      setExistingPost(null)
      setLoadingPost(false)
      return
    }
    let mounted = true
    setLoadingPost(true)
    getPost(numericId)
      .then((data) => {
        if (!mounted) return
        setExistingPost(data)
        setBoardType(data.boardType)
        setTitle(data.title)
        setContent(data.content)
      })
      .catch(() => {
        if (mounted) setExistingPost(null)
      })
      .finally(() => {
        if (mounted) setLoadingPost(false)
      })
    return () => {
      mounted = false
    }
  }, [isEditMode, numericId])

  if (authLoading || loadingPost) {
    return (
      <div className="max-w-5xl mx-auto rounded-3xl bg-white border border-warm-200 p-10 sm:p-14 text-center shadow-warm-card text-xs sm:text-sm text-warm-400">
        에디터를 불러오는 중입니다...
      </div>
    )
  }

  // 비로그인 상태에서는 글쓰기·수정 차단 및 로그인 안내
  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-5xl mx-auto rounded-3xl bg-white border border-warm-200 p-10 sm:p-14 text-center shadow-warm-card space-y-4">
        <div className="text-4xl">🔒</div>
        <h1 className="font-display font-extrabold text-xl text-warm-900">
          로그인이 필요한 페이지입니다
        </h1>
        <p className="text-xs sm:text-sm text-warm-500">
          게시글 작성 및 수정은 로그인한 회원만 이용할 수 있습니다.
        </p>
        <div className="pt-2 flex items-center justify-center gap-2.5">
          <Link
            to="/board"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-warm-100 text-warm-700 text-xs sm:text-sm font-bold hover:bg-warm-200 transition-all"
          >
            ← 목록으로
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-arcade-coral text-white text-xs sm:text-sm font-bold hover:bg-arcade-coralHover transition-all"
          >
            로그인하러 가기
          </Link>
        </div>
      </div>
    )
  }

  if (isEditMode && !existingPost) {
    return (
      <div className="max-w-5xl mx-auto rounded-3xl bg-white border border-warm-200 p-10 sm:p-14 text-center shadow-warm-card space-y-4">
        <div className="text-4xl">⚠️</div>
        <h1 className="font-display font-extrabold text-xl text-warm-900">
          수정할 게시글을 찾을 수 없습니다
        </h1>
        <p className="text-xs sm:text-sm text-warm-500">
          삭제되었거나 존재하지 않는 게시글입니다.
        </p>
        <div className="pt-2">
          <Link
            to="/board"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-warm-900 text-white text-xs sm:text-sm font-bold hover:bg-warm-800 transition-all"
          >
            ← 게시판 목록으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  // 작성자 본인만 수정 가능 (§3-6-3)
  if (isEditMode && existingPost && existingPost.userId !== user.id) {
    return (
      <div className="max-w-5xl mx-auto rounded-3xl bg-white border border-warm-200 p-10 sm:p-14 text-center shadow-warm-card space-y-4">
        <div className="text-4xl">🚫</div>
        <h1 className="font-display font-extrabold text-xl text-warm-900">
          수정 권한이 없습니다
        </h1>
        <p className="text-xs sm:text-sm text-warm-500">
          게시글 수정은 작성자 본인만 가능합니다.
        </p>
        <div className="pt-2">
          <Link
            to={`/board/${existingPost.id}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-warm-900 text-white text-xs sm:text-sm font-bold hover:bg-warm-800 transition-all"
          >
            ← 게시글로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  const charCount = content.length
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0
  const isDirty =
    title.trim() !== (existingPost?.title ?? '') ||
    content.trim() !== (existingPost?.content ?? '')

  // 커서 위치에 마크다운 서식 토큰 삽입
  const insertFormatting = (prefix: string, suffix = '', placeholder = '') => {
    const textarea = contentTextareaRef.current
    if (!textarea) {
      setContent((prev) => `${prev}${prev ? '\n' : ''}${prefix}${placeholder}${suffix}`)
      return
    }

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = content.slice(start, end)
    const body = selected || placeholder
    const nextValue =
      content.slice(0, start) + prefix + body + suffix + content.slice(end)

    setContent(nextValue)
    if (contentError) setContentError(null)
    setEditorTab('WRITE')

    window.requestAnimationFrame(() => {
      textarea.focus()
      const cursorStart = start + prefix.length
      const cursorEnd = cursorStart + body.length
      textarea.setSelectionRange(cursorStart, cursorEnd)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    const trimmedTitle = title.trim()
    const trimmedContent = content.trim()

    let hasError = false
    if (!trimmedTitle) {
      setTitleError('게시글 제목을 입력해주세요.')
      titleInputRef.current?.focus()
      hasError = true
    } else {
      setTitleError(null)
    }

    if (!trimmedContent) {
      setContentError('게시글 본문 내용을 입력해주세요.')
      if (!hasError) contentTextareaRef.current?.focus()
      hasError = true
    } else {
      setContentError(null)
    }

    if (hasError) return

    setSubmitting(true)
    try {
      if (isEditMode && existingPost) {
        const updated = await updatePost(existingPost.id, {
          boardType,
          title: trimmedTitle,
          content: trimmedContent,
        })
        navigate(`/board/${updated.id}`)
        return
      }

      const created = await createPost({
        boardType,
        title: trimmedTitle,
        content: trimmedContent,
      })
      navigate(`/board/${created.id}`)
    } catch (err) {
      setSubmitError(getErrorMessage(err, '게시글 저장에 실패했습니다.'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelClick = () => {
    if (isDirty) {
      setIsDiscardModalOpen(true)
      return
    }
    navigate(isEditMode && existingPost ? `/board/${existingPost.id}` : '/board')
  }

  // FAQ 옵션은 관리자에게만 노출 (§3-5-4)
  const visibleBoardTypeOptions = BOARD_TYPE_OPTIONS.filter(
    (opt) => !opt.adminOnly || isAdmin,
  )

  const selectedBoardMeta =
    BOARD_TYPE_OPTIONS.find((opt) => opt.key === boardType) ?? BOARD_TYPE_OPTIONS[0]

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleCancelClick}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-warm-600 hover:text-warm-900 transition-colors"
        >
          <span>←</span>
          <span>{isEditMode ? '게시글 상세로 돌아가기' : '게시판 목록으로'}</span>
        </button>

        <span className="font-mono text-xs text-warm-400">
          {isEditMode ? `EDIT #${existingPost?.id}` : 'NEW POST'}
        </span>
      </div>

      {/* Single Mode Editor Card */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="rounded-3xl bg-white border border-warm-200 shadow-warm-card overflow-hidden"
      >
        {/* Header & Category Selector */}
        <div className="p-6 sm:p-8 border-b border-warm-100 space-y-5">
          <div>
            <h1 className="font-display font-extrabold text-xl sm:text-2xl text-warm-900">
              {isEditMode ? '게시글 수정하기' : '새 게시글 작성'}
            </h1>
            <p className="text-xs sm:text-sm text-warm-500 mt-1">
              게시판 분류를 선택하고 마크다운 서식 도구를 활용해 글을 작성해보세요.
            </p>
          </div>

          {/* Board Type Buttons */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-warm-700">
              게시판 분류 선택
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {visibleBoardTypeOptions.map((opt) => {
                const isSelected = boardType === opt.key
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setBoardType(opt.key)}
                    className={`flex items-center justify-between px-4 py-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-warm-900 text-white border-warm-900 shadow-sm'
                        : 'bg-white text-warm-800 border-warm-200 hover:bg-warm-50 hover:border-warm-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{opt.badge}</span>
                      <span className="text-xs sm:text-sm font-bold">{opt.label}</span>
                    </div>
                    {opt.adminOnly && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          isSelected
                            ? 'bg-arcade-coral text-white'
                            : 'bg-warm-200 text-warm-600'
                        }`}
                      >
                        ADMIN
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            <p className="text-[11px] text-warm-500 pl-1">
              {selectedBoardMeta.badge} {selectedBoardMeta.desc}
            </p>
          </div>

          {/* Title Input */}
          <div className="space-y-1.5">
            <label htmlFor="post-title" className="block text-xs font-bold text-warm-700">
              제목
            </label>
            <input
              id="post-title"
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (titleError) setTitleError(null)
              }}
              placeholder="핵심 내용이 잘 드러나도록 제목을 입력해주세요"
              className={`w-full px-4 py-3 rounded-2xl bg-warm-50 border text-sm sm:text-base font-bold text-warm-900 placeholder-warm-400 focus:outline-none focus:bg-white transition-all ${
                titleError
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15'
                  : 'border-warm-200 focus:border-arcade-coral focus:ring-2 focus:ring-arcade-coral/15'
              }`}
            />
            {titleError && (
              <p className="text-xs font-semibold text-rose-600 pl-1">{titleError}</p>
            )}
          </div>
        </div>

        {/* Single Editor Toolbar & Canvas */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-warm-100">
            {/* Formatting Toolbar */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => insertFormatting('## ', '', '소제목을 입력하세요')}
                className="px-2.5 py-1.5 rounded-xl bg-warm-100 hover:bg-warm-200 text-xs font-mono font-bold text-warm-800 transition-colors"
                title="소제목 (H2)"
              >
                H2
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('### ', '', '작은 소제목을 입력하세요')}
                className="px-2.5 py-1.5 rounded-xl bg-warm-100 hover:bg-warm-200 text-xs font-mono font-bold text-warm-800 transition-colors"
                title="작은 소제목 (H3)"
              >
                H3
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('**', '**', '강조할 텍스트')}
                className="px-2.5 py-1.5 rounded-xl bg-warm-100 hover:bg-warm-200 text-xs font-bold text-warm-800 transition-colors"
                title="굵게"
              >
                B 굵게
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('`', '`', 'code')}
                className="px-2.5 py-1.5 rounded-xl bg-warm-100 hover:bg-warm-200 text-xs font-mono font-semibold text-arcade-coral transition-colors"
                title="인라인 코드"
              >
                {'`코드`'}
              </button>
              <button
                type="button"
                onClick={() =>
                  insertFormatting(
                    '```javascript\n',
                    '\n```',
                    '// 여기에 코드를 작성하세요',
                  )
                }
                className="px-2.5 py-1.5 rounded-xl bg-warm-900 hover:bg-warm-800 text-xs font-mono font-bold text-white transition-colors"
                title="코드 블록"
              >
                💻 코드블록
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('> ', '', '인용할 문장을 입력하세요')}
                className="px-2.5 py-1.5 rounded-xl bg-warm-100 hover:bg-warm-200 text-xs font-semibold text-warm-700 transition-colors"
                title="인용구"
              >
                “ 인용구
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('- ', '', '목록 항목')}
                className="px-2.5 py-1.5 rounded-xl bg-warm-100 hover:bg-warm-200 text-xs font-semibold text-warm-700 transition-colors"
                title="불릿 목록"
              >
                • 목록
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('\n---\n', '', '')}
                className="px-2.5 py-1.5 rounded-xl bg-warm-100 hover:bg-warm-200 text-xs font-semibold text-warm-700 transition-colors"
                title="구분선"
              >
                ― 구분선
              </button>
            </div>

            {/* Single Canvas Mode Switch: Write vs Preview */}
            <div className="inline-flex rounded-xl bg-warm-100 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setEditorTab('WRITE')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  editorTab === 'WRITE'
                    ? 'bg-white text-warm-900 shadow-xs'
                    : 'text-warm-500 hover:text-warm-800'
                }`}
              >
                ✏️ 작성하기
              </button>
              <button
                type="button"
                onClick={() => setEditorTab('PREVIEW')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  editorTab === 'PREVIEW'
                    ? 'bg-white text-warm-900 shadow-xs'
                    : 'text-warm-500 hover:text-warm-800'
                }`}
              >
                👁️ 본문 미리보기
              </button>
            </div>
          </div>

          {/* Single Canvas Body */}
          {editorTab === 'WRITE' ? (
            <div className="space-y-1.5">
              <textarea
                ref={contentTextareaRef}
                rows={14}
                value={content}
                onChange={(e) => {
                  setContent(e.target.value)
                  if (contentError) setContentError(null)
                }}
                placeholder={`내용을 입력해주세요.\n\n예시:\n## 스테이지 공략 핵심\n- 첫 번째 팁\n\`\`\`javascript\nconst score = 2850;\n\`\`\``}
                className={`w-full p-4 rounded-2xl bg-warm-50 border text-sm text-warm-800 placeholder-warm-400 leading-relaxed focus:outline-none focus:bg-white transition-all resize-y ${
                  contentError
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15'
                    : 'border-warm-200 focus:border-arcade-coral focus:ring-2 focus:ring-arcade-coral/15'
                }`}
              />
              {contentError && (
                <p className="text-xs font-semibold text-rose-600 pl-1">{contentError}</p>
              )}
            </div>
          ) : (
            <div className="min-h-[320px] p-5 sm:p-6 rounded-2xl bg-warm-50/60 border border-warm-200">
              {content.trim() ? (
                <PostContentRenderer content={content} />
              ) : (
                <p className="text-xs sm:text-sm text-warm-400 text-center py-20">
                  작성된 본문 내용이 없습니다. [작성하기] 탭에서 내용을 입력해주세요.
                </p>
              )}
            </div>
          )}

          {submitError && (
            <p className="text-xs font-semibold text-rose-600 pl-1">{submitError}</p>
          )}

          {/* Footer: Word Counter & Submit Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-warm-100">
            <div className="flex items-center gap-3 font-mono text-xs text-warm-400">
              <span>{charCount.toLocaleString()} 글자</span>
              <span>·</span>
              <span>{wordCount.toLocaleString()} 단어</span>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={submitting}
                onClick={handleCancelClick}
                className="px-4 py-2.5 rounded-2xl bg-warm-100 text-warm-700 text-xs sm:text-sm font-bold hover:bg-warm-200 transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-2xl bg-arcade-coral text-white text-xs sm:text-sm font-bold hover:bg-arcade-coral-dark transition-all shadow-sm disabled:opacity-50"
              >
                {submitting
                  ? '저장 중...'
                  : isEditMode
                    ? '수정 완료'
                    : '게시글 등록'}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Custom Discard Confirmation Modal (Zero Alert/Confirm) */}
      {isDiscardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-warm-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white border border-warm-200 p-6 sm:p-7 shadow-xl space-y-5">
            <div className="space-y-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold">
                작성 취소 확인
              </span>
              <h2 className="font-display font-extrabold text-lg text-warm-900">
                작성 중인 내용을 취소하시겠습니까?
              </h2>
              <p className="text-xs sm:text-sm text-warm-500 leading-relaxed">
                변경된 내용이 저장되지 않고 사라집니다. 목록으로 이동하시겠습니까?
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setIsDiscardModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-warm-100 text-warm-700 text-xs sm:text-sm font-bold hover:bg-warm-200 transition-colors"
              >
                계속 작성하기
              </button>
              <button
                type="button"
                onClick={() =>
                  navigate(
                    isEditMode && existingPost ? `/board/${existingPost.id}` : '/board',
                  )
                }
                className="px-4 py-2.5 rounded-xl bg-warm-900 text-white text-xs sm:text-sm font-bold hover:bg-warm-800 transition-colors"
              >
                저장하지 않고 나가기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
