import { Button } from '../../components'

// [허 담당] 추천·비추천 토글 버튼 UI
export function VoteButtons() {
  return (
    <div className="flex items-center gap-2">
      <Button variant="secondary">👍 추천 (0)</Button>
      <Button variant="secondary">👎 비추천 (0)</Button>
    </div>
  )
}
