import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '../../components'
import { CommentSection } from '../../features/comments/CommentSection'
import { LeaderboardSection } from '../../features/leaderboard/LeaderboardSection'
import { GameFrame } from '../../features/player/GameFrame'
import { PlayModal } from '../../features/player/PlayModal'
import { VoteButtons } from '../../features/vote/VoteButtons'

export function AppDetailPage() {
  const { appId } = useParams()
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-6">
        <div>
          <h1 className="text-2xl font-bold">타이니앱 상세 #{appId} (AppDetailPage)</h1>
          <p className="mt-1 text-sm text-slate-600">내 최고 점수: - 점</p>
        </div>
        <div className="flex items-center gap-3">
          <VoteButtons />
          <Button onClick={() => setModalOpen(true)}>모달로 플레이</Button>
        </div>
      </div>

      <GameFrame title={`TinyApp #${appId}`} />

      <LeaderboardSection />

      <CommentSection targetType="APP" targetId={Number(appId) || 1} />

      <PlayModal
        open={modalOpen}
        title={`타이니앱 #${appId}`}
        onClose={() => setModalOpen(false)}
      />
    </div>
  )
}
