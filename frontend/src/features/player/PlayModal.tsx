import { Modal } from '../../components'
import { GameFrame } from './GameFrame'

interface PlayModalProps {
  open: boolean
  title: string
  src?: string
  onClose: () => void
}

// [허 담당] 모달 외형·전체화면 버튼
export function PlayModal({ open, title, src, onClose }: PlayModalProps) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <div className="space-y-3">
        <div className="flex justify-end">
          <button
            type="button"
            className="rounded border border-slate-300 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100"
          >
            전체화면
          </button>
        </div>
        <GameFrame src={src} title={title} />
      </div>
    </Modal>
  )
}
