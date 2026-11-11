import axios from 'axios'
import { useEffect, useState } from 'react'
import { getErrorMessage } from '../../api/client'
import { getMyVote, vote } from '../../api/votes'
import type { VoteType } from '../../types'

interface VoteButtonsProps {
  appId?: number
  refreshKey?: number
  initialRecommendCount?: number
  initialNotRecommendCount?: number
  hasPlayed?: boolean
  showNoticeBanner?: boolean
  onNotify?: (message: string, type?: 'info' | 'success' | 'warn') => void
}

// [허 담당] 플레이어 유용성 평가 (유튜브식 추천·비추천 토글 바, 실시간 API 연동)
export function VoteButtons({
  appId,
  refreshKey,
  initialRecommendCount = 0,
  initialNotRecommendCount = 0,
  onNotify,
}: VoteButtonsProps) {
  const [voted, setVoted] = useState<VoteType | null>(null)
  const [hasPlayed, setHasPlayed] = useState(false)
  const [recommendCount, setRecommendCount] = useState(initialRecommendCount)
  const [notRecommendCount, setNotRecommendCount] = useState(initialNotRecommendCount)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setRecommendCount(initialRecommendCount)
  }, [initialRecommendCount])

  useEffect(() => {
    setNotRecommendCount(initialNotRecommendCount)
  }, [initialNotRecommendCount])

  useEffect(() => {
    if (!appId) return

    let mounted = true
    getMyVote(appId)
      .then((res) => {
        if (!mounted) return
        setVoted(res.myVote)
        setHasPlayed(res.hasPlayed)
      })
      .catch(() => {
        if (!mounted) return
        setVoted(null)
        setHasPlayed(false)
      })

    return () => {
      mounted = false
    }
  }, [appId, refreshKey])

  const handleVote = async (type: VoteType) => {
    if (!appId) return
    if (!hasPlayed) {
      onNotify?.('게임 플레이(점수 제출) 1회 이상 완료 후 평가가 가능합니다.', 'warn')
      return
    }
    if (submitting) return

    setSubmitting(true)
    try {
      const res = await vote(appId, type)
      setVoted(res.myVote)
      setRecommendCount(res.recommendCount)
      setNotRecommendCount(res.notRecommendCount)

      if (res.myVote) {
        onNotify?.('반영되었습니다', 'info')
      } else {
        onNotify?.('취소되었습니다', 'info')
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status
        const code = err.response?.data?.code
        if (status === 401 || code === 'UNAUTHORIZED') {
          onNotify?.('로그인 후 이용할 수 있습니다.', 'warn')
          return
        }
      }
      onNotify?.(getErrorMessage(err, '투표 처리에 실패했습니다.'), 'warn')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-warm-400 font-mono">
          플레이어 유용성 평가
        </span>
        <span className="text-xs text-warm-400">
          {!hasPlayed ? '플레이 후 평가 가능' : '1회 이상 플레이한 유저만 참여 가능'}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Recommend */}
        <button
          type="button"
          onClick={() => handleVote('RECOMMEND')}
          disabled={!hasPlayed || submitting}
          className={`flex-1 py-2.5 px-3 rounded-xl border font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            voted === 'RECOMMEND'
              ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
              : 'border-warm-200 bg-warm-50 text-warm-700 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700'
          }`}
        >
          <svg
            className={`w-4 h-4 ${voted === 'RECOMMEND' ? 'text-white' : 'text-emerald-600'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
            />
          </svg>
          <span>추천</span>
          <span
            className={`font-mono px-2 py-0.5 rounded-lg border text-xs ${
              voted === 'RECOMMEND'
                ? 'bg-emerald-600 border-emerald-400 text-white'
                : 'bg-white border-warm-200 text-warm-800'
            }`}
          >
            {recommendCount}
          </span>
        </button>

        {/* Not Recommend */}
        <button
          type="button"
          onClick={() => handleVote('NOT_RECOMMEND')}
          disabled={!hasPlayed || submitting}
          className={`flex-1 py-2.5 px-3 rounded-xl border font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            voted === 'NOT_RECOMMEND'
              ? 'bg-warm-900 text-white border-warm-900 shadow-sm'
              : 'border-warm-200 bg-warm-50 text-warm-600 hover:bg-warm-100 hover:text-warm-900'
          }`}
        >
          <svg
            className={`w-4 h-4 ${voted === 'NOT_RECOMMEND' ? 'text-white' : 'text-warm-400'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.766 1.045m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"
            />
          </svg>
          <span>비추천</span>
          <span
            className={`font-mono px-2 py-0.5 rounded-lg border text-xs ${
              voted === 'NOT_RECOMMEND'
                ? 'bg-warm-800 border-warm-700 text-white'
                : 'bg-white border-warm-200 text-warm-600'
            }`}
          >
            {notRecommendCount}
          </span>
        </button>
      </div>

      {!hasPlayed && (
        <div className="text-xs text-warm-500 bg-warm-50 p-2.5 rounded-xl border border-warm-200">
          💡 플레이 후 평가 가능 (게임 플레이 1회 완료 후 투표할 수 있습니다)
        </div>
      )}
    </div>
  )
}
