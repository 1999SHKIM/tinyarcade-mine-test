import { useRef, useState } from 'react'
import { MOCK_APP_COMMENTS, MOCK_RANKING_COMMENTS } from '../../mocks'
import type { CommentItem, CommentTargetType } from '../../types'
import { useAuth } from '../auth/useAuth'

interface CommentSectionProps {
  targetType: CommentTargetType
  targetId?: number | null
  initialComments?: CommentItem[]
  onNotify?: (message: string, type?: 'info' | 'success' | 'warn') => void
}

// [허 담당] 댓글·대댓글 (게시글·앱·랭킹 공용, 대댓글 1단계 지원)
export function CommentSection({
  targetType,
  targetId = 1,
  initialComments,
  onNotify,
}: CommentSectionProps) {
  const { user, isAuthenticated } = useAuth()
  const defaultList =
    initialComments ??
    (targetType === 'RANKING' ? MOCK_RANKING_COMMENTS : MOCK_APP_COMMENTS)
  const [comments, setComments] = useState<CommentItem[]>(defaultList)
  const [content, setContent] = useState('')
  const [replyTarget, setReplyTarget] = useState<{ id: number; nickname: string } | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const totalCount = comments.reduce(
    (sum, item) => sum + 1 + (item.replies ? item.replies.length : 0),
    0,
  )

  const handleReplyClick = (commentId: number, nickname: string) => {
    setReplyTarget({ id: commentId, nickname })
    textareaRef.current?.focus()
    onNotify?.(`@${nickname} 님에게 답글 입력 모드로 전환되었습니다.`, 'info')
  }

  const handleSubmit = () => {
    if (!isAuthenticated || !user) {
      onNotify?.('로그인 후 댓글을 작성할 수 있습니다.', 'warn')
      return
    }

    const trimmed = content.trim()
    if (!trimmed) {
      onNotify?.('댓글 내용을 입력해주세요.', 'warn')
      return
    }

    if (replyTarget) {
      setComments((prev) =>
        prev.map((item) =>
          item.id === replyTarget.id
            ? {
                ...item,
                replies: [
                  ...(item.replies ?? []),
                  {
                    id: Date.now(),
                    parentId: item.id,
                    userId: user.id,
                    nickname: `${user.nickname} (나)`,
                    userStatus: user.status,
                    content: trimmed,
                    createdAt: '방금 전',
                  },
                ],
              }
            : item,
        ),
      )
      setReplyTarget(null)
      setContent('')
      onNotify?.('답글이 등록되었습니다!', 'success')
      return
    }

    const newComment: CommentItem = {
      id: Date.now(),
      targetType,
      targetId: targetId ?? null,
      userId: user.id,
      nickname: `${user.nickname} (나)`,
      userStatus: user.status,
      rankBadge: targetType === 'RANKING' ? '종합 4위' : '1,420점',
      content: trimmed,
      createdAt: '방금 전',
      replies: [],
    }

    setComments((prev) => [newComment, ...prev])
    setContent('')
    onNotify?.(
      targetType === 'RANKING'
        ? '명예의 전당 축하 응원이 등록되었습니다!'
        : '댓글이 성공적으로 등록되었습니다!',
      'success',
    )
  }

  return (
    <div className="bg-white border border-warm-200 rounded-3xl p-5 sm:p-6 space-y-4 shadow-warm-card">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-bold text-base sm:text-lg text-warm-900 flex items-center gap-2">
            <span>
              {targetType === 'APP'
                ? '플레이어 한줄평 & 공략'
                : targetType === 'RANKING'
                  ? '🏆 명예의 전당 한줄평 & 축하 응원'
                  : '댓글'}
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-warm-100 text-warm-600 font-bold">
              {totalCount}
            </span>
          </h3>
          {targetType === 'RANKING' && (
            <p className="text-xs text-warm-500 mt-0.5">
              상위 랭커들에게 축하와 도전의 메시지를 남겨보세요!
            </p>
          )}
        </div>
        <span className="text-xs text-warm-400">대댓글 1단계 지원</span>
      </div>

      {/* Write Comment */}
      <div className="space-y-2.5">
        {replyTarget && (
          <div className="flex items-center justify-between rounded-xl bg-rose-50 border border-rose-100 px-3 py-1.5 text-xs text-arcade-coral font-semibold">
            <span>@{replyTarget.nickname} 님에게 답글 작성 중...</span>
            <button
              type="button"
              onClick={() => setReplyTarget(null)}
              className="text-warm-500 hover:text-warm-800 underline"
            >
              취소
            </button>
          </div>
        )}
        <textarea
          ref={textareaRef}
          rows={2}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={
            replyTarget
              ? `@${replyTarget.nickname} 님에게 답글을 남겨보세요!`
              : targetType === 'RANKING'
                ? '이번 주 1위 @코딩마스터 님 축하드립니다! 다음 주엔 제가 1등 갑니다 ㅎㅎ'
                : '공략 꿀팁이나 버그 피드백을 남겨보세요!'
          }
          className="w-full bg-warm-50 border border-warm-200 rounded-2xl p-3 text-xs sm:text-sm text-warm-800 placeholder-warm-400 focus:outline-none focus:bg-white focus:border-arcade-coral focus:ring-2 focus:ring-arcade-coral/10 transition-all resize-none"
        />
        <div className="flex justify-between items-center">
          <span className="text-[11px] text-warm-400">상호 존중하는 오락실 커뮤니티</span>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 rounded-xl bg-warm-900 text-white font-bold text-xs hover:bg-warm-800 active:scale-95 transition-all shadow-sm"
          >
            {replyTarget
              ? '답글 등록'
              : targetType === 'RANKING'
                ? '응원 등록'
                : '댓글 등록'}
          </button>
        </div>
      </div>

      {/* Comments Feed */}
      <div className="space-y-3 pt-1">
        {comments.map((comment) => {
          const isWithdrawn = comment.userStatus === 'WITHDRAWN'
          return (
            <div
              key={comment.id}
              className="p-3.5 rounded-2xl bg-warm-50 border border-warm-100 space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-bold ${
                      isWithdrawn
                        ? 'text-warm-500'
                        : comment.nickname.includes('(나)')
                          ? 'text-arcade-coral'
                          : 'text-warm-800'
                    }`}
                  >
                    {isWithdrawn ? '탈퇴한 유저' : comment.nickname}
                  </span>
                  <span className="text-[10px] text-warm-400">{comment.createdAt}</span>
                </div>
                {comment.rankBadge && (
                  <span className="text-[11px] font-mono font-bold text-arcade-coral">
                    {comment.rankBadge}
                  </span>
                )}
              </div>

              <p
                className={`text-xs sm:text-sm leading-relaxed ${
                  isWithdrawn ? 'text-warm-600' : 'text-warm-700'
                }`}
              >
                {comment.content}
              </p>

              {!isWithdrawn && (
                <div className="flex items-center gap-4 text-xs text-warm-400">
                  <button
                    type="button"
                    onClick={() => handleReplyClick(comment.id, comment.nickname)}
                    className="hover:text-arcade-coral font-semibold transition-colors"
                  >
                    답글 달기
                  </button>
                </div>
              )}

              {/* 1-Level Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-3 pl-3 border-l-2 border-warm-200 pt-1.5 space-y-1.5">
                  {comment.replies.map((reply) => (
                    <div
                      key={reply.id}
                      className="p-2.5 rounded-xl bg-white border border-warm-200/80"
                    >
                      <div className="flex items-center gap-2 text-xs">
                        <span
                          className={`font-bold ${
                            reply.isCreator ? 'text-arcade-coral' : 'text-warm-800'
                          }`}
                        >
                          {reply.userStatus === 'WITHDRAWN' ? '탈퇴한 유저' : reply.nickname}
                        </span>
                        {reply.isCreator && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-50 text-arcade-coral text-[9px] font-bold border border-rose-100">
                            크리에이터
                          </span>
                        )}
                        <span className="text-[10px] text-warm-400">{reply.createdAt}</span>
                      </div>
                      <p className="text-xs text-warm-600 mt-1">{reply.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
