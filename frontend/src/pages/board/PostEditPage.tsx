import { useParams } from 'react-router-dom'

export function PostEditPage() {
  const { postId } = useParams()

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
      <h1 className="text-2xl font-bold">
        {postId ? `게시글 수정 #${postId}` : '새 게시글 작성'} (PostEditPage)
      </h1>
      <p className="text-sm text-slate-600">게시판 종류 선택, 제목, 본문 입력 폼 영역</p>
    </div>
  )
}
