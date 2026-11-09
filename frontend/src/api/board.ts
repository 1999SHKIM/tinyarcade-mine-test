import type {
  BoardType,
  CommentItem,
  CommentTargetType,
  PostItem,
} from '../types'
import api from './client'

// [허 담당] 19번 게시판·댓글 API (토큰은 client.ts가 자동으로 첨부)

export interface PostPayload {
  boardType: BoardType
  title: string
  content: string
}

export interface CommentPayload {
  targetType: CommentTargetType
  targetId?: number | null
  parentId?: number | null
  content: string
}

/** GET /api/posts → 게시글 전체 목록 */
export async function getPosts(): Promise<PostItem[]> {
  const { data } = await api.get<PostItem[]>('/posts')
  return data
}

/** GET /api/posts/{id} → 게시글 상세 */
export async function getPost(postId: number): Promise<PostItem> {
  const { data } = await api.get<PostItem>(`/posts/${postId}`)
  return data
}

/** POST /api/posts → 게시글 작성 (로그인 필요) */
export async function createPost(body: PostPayload): Promise<PostItem> {
  const { data } = await api.post<PostItem>('/posts', body)
  return data
}

/** PUT /api/posts/{id} → 게시글 수정 (작성자 본인만) */
export async function updatePost(postId: number, body: PostPayload): Promise<PostItem> {
  const { data } = await api.put<PostItem>(`/posts/${postId}`, body)
  return data
}

/** DELETE /api/posts/{id} → 게시글 삭제 (작성자 본인 또는 관리자) */
export async function deletePost(postId: number): Promise<void> {
  await api.delete(`/posts/${postId}`)
}

/** GET /api/comments → 댓글·대댓글 트리 목록 */
export async function getComments(
  targetType: CommentTargetType,
  targetId?: number | null,
): Promise<CommentItem[]> {
  const params: Record<string, string | number> = { targetType }
  if (targetId !== undefined && targetId !== null && targetType !== 'RANKING') {
    params.targetId = targetId
  }
  const { data } = await api.get<CommentItem[]>('/comments', { params })
  return data
}

/** POST /api/comments → 댓글·대댓글 작성 (로그인 필요) */
export async function createComment(body: CommentPayload): Promise<CommentItem[]> {
  const { data } = await api.post<CommentItem[]>('/comments', body)
  return data
}

/** PUT /api/comments/{id} → 댓글·대댓글 수정 (작성자 본인만) */
export async function updateComment(commentId: number, content: string): Promise<void> {
  await api.put(`/comments/${commentId}`, { content })
}

/** DELETE /api/comments/{id} → 댓글·대댓글 삭제 (작성자 본인만) */
export async function deleteComment(commentId: number): Promise<void> {
  await api.delete(`/comments/${commentId}`)
}

export { api }
