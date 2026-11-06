import { Link, useParams } from 'react-router-dom'
import { CommentSection } from '../../features/comments/CommentSection'

export function PostDetailPage() {
  const { postId } = useParams()

  return (
    <div className="space-y-6">
      <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">게시글 상세 #{postId} (PostDetailPage)</h1>
          <Link
            to={`/board/${postId}/edit`}
            className="text-sm font-medium text-indigo-600 hover:underline"
          >
            수정하기
          </Link>
        </div>
        <p className="text-sm text-slate-600">게시글 본문 영역 (텍스트 렌더링)</p>
      </div>

      <CommentSection targetType="POST" targetId={Number(postId) || 1} />
    </div>
  )
}
