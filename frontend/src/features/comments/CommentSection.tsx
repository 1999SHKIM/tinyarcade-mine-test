import type { CommentTargetType } from '../../types'

interface CommentSectionProps {
  targetType: CommentTargetType
  targetId?: number | null
}

// [허 담당] 댓글·대댓글 (게시글·앱·랭킹 공용, 대댓글 1단계)
export function CommentSection({ targetType, targetId }: CommentSectionProps) {
  return (
    <section className="space-y-2 rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="font-semibold text-slate-900">댓글</h3>
      <p className="text-sm text-slate-600">
        공용 댓글·대댓글 영역 (대상: {targetType}
        {targetId ? ` #${targetId}` : ''})
      </p>
    </section>
  )
}
