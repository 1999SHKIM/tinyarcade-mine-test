import { useCallback, useEffect, useState } from 'react'
import {
  approveAdminVerification,
  deleteAdminVerification,
  getAdminVerifications,
  type AdminVerification,
} from '../../api/admin'
import { getErrorMessage } from '../../api/client'

interface ToastItem {
  id: number
  message: string
  type: 'info' | 'success' | 'warn'
}

export function AdminVerifyPage() {
  const [verifications, setVerifications] = useState<AdminVerification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)

  // [삭제] 확인 모달 대상
  const [deleteTarget, setDeleteTarget] = useState<AdminVerification | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // 토스트 알림
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const showToast = useCallback(
    (message: string, type: 'info' | 'success' | 'warn' = 'info') => {
      const id = Date.now() + Math.floor(Math.random() * 1000)
      setToasts((prev) => [...prev, { id, message, type }])
      setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== id))
      }, 3200)
    },
    [],
  )

  const loadVerifications = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getAdminVerifications()
      setVerifications(data)
    } catch (err) {
      setError(getErrorMessage(err, '검증 대기 목록을 불러오지 못했습니다.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadVerifications()
  }, [loadVerifications])

  const formatDate = (iso?: string | null) => {
    if (!iso) return '-'
    return iso.slice(0, 10)
  }

  const formatPlayTime = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}초`
    }
    const min = Math.floor(seconds / 60)
    const sec = seconds % 60
    return `${min}분 ${sec}초`
  }

  const formatScore = (score: number, maxScore: number | null) => {
    if (maxScore !== null && maxScore !== undefined) {
      return `${score} / ${maxScore}`
    }
    return `${score}`
  }

  // [인정] 처리 (확인 창 없이 바로 처리)
  const handleApprove = async (item: AdminVerification) => {
    setProcessingId(item.sessionId)
    try {
      await approveAdminVerification(item.sessionId)
      showToast(`"${item.appTitle}" 플레이 기록을 인정 처리했습니다.`, 'success')
      await loadVerifications()
    } catch (err) {
      showToast(getErrorMessage(err, '기록 인정 처리에 실패했습니다.'), 'warn')
    } finally {
      setProcessingId(null)
    }
  }

  // [삭제] 모달 열기
  const openDeleteModal = (item: AdminVerification) => {
    setDeleteTarget(item)
    setDeleteError(null)
  }

  // [삭제] 모달 확정 처리
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setProcessingId(deleteTarget.sessionId)
    setDeleteError(null)
    try {
      await deleteAdminVerification(deleteTarget.sessionId)
      showToast(`"${deleteTarget.appTitle}" 기록을 삭제했습니다.`, 'info')
      setDeleteTarget(null)
      await loadVerifications()
    } catch (err) {
      setDeleteError(getErrorMessage(err, '기록 삭제 처리에 실패했습니다.'))
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="space-y-5">
      <section className="bg-white border border-warm-200 rounded-3xl shadow-warm-card overflow-hidden">
        {/* 상단 헤더 & 안내 문구 */}
        <div className="px-6 sm:px-8 pt-6 sm:pt-7 pb-5 border-b border-warm-200/80 space-y-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">⚖️</span>
              <h2 className="font-display font-extrabold text-xl sm:text-2xl text-warm-900 tracking-tight">
                이상값 검증 대기
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-warm-500 mt-1">
              비정상적으로 높거나 통계적 이상값으로 판정된 플레이 기록을 검토하고 인정 또는 삭제합니다.
            </p>
          </div>

          {/* 지시서 지정 안내 문구 */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-bold leading-relaxed">
            통계적으로 드문 기록입니다. 부정행위의 확정 증거가 아닙니다. 주간 마감 때까지 처리하지 않으면 자동으로 인정됩니다.
          </div>
        </div>

        {/* 표 영역 */}
        {loading ? (
          <div className="py-16 px-6 text-center text-xs font-bold text-warm-400">
            검증 대기 기록을 불러오는 중입니다...
          </div>
        ) : error ? (
          <div className="py-16 px-6 text-center space-y-2">
            <div className="font-display font-bold text-sm text-rose-600">{error}</div>
          </div>
        ) : verifications.length === 0 ? (
          <div className="py-16 px-6 text-center space-y-1">
            <div className="font-display font-bold text-sm text-warm-700">
              검증 대기 중인 기록이 없습니다
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-warm-200 bg-warm-50/70 text-warm-500 font-bold">
                  <th className="py-3.5 pl-6 pr-3">앱</th>
                  <th className="py-3.5 px-3">유저</th>
                  <th className="py-3.5 px-3">점수</th>
                  <th className="py-3.5 px-3">플레이 시간</th>
                  <th className="py-3.5 px-3">제출 시각</th>
                  <th className="py-3.5 pl-3 pr-6 text-right">동작</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-200/80">
                {verifications.map((v) => {
                  const isBusy = processingId === v.sessionId

                  return (
                    <tr key={v.sessionId} className="hover:bg-warm-50/60 transition-colors">
                      <td className="py-4 pl-6 pr-3 align-middle font-bold text-sm text-warm-900">
                        {v.appTitle}
                      </td>
                      <td className="py-4 px-3 align-middle font-bold text-warm-800">
                        {v.userNickname}
                      </td>
                      <td className="py-4 px-3 align-middle font-mono font-bold text-arcade-coral">
                        {formatScore(v.score, v.appMaxScore)}
                      </td>
                      <td className="py-4 px-3 align-middle font-mono text-warm-600">
                        {formatPlayTime(v.playSeconds)}
                      </td>
                      <td className="py-4 px-3 align-middle font-mono text-warm-500">
                        {formatDate(v.submittedAt)}
                      </td>
                      <td className="py-4 pl-3 pr-6 align-middle text-right space-x-1.5">
                        <button
                          type="button"
                          onClick={() => void handleApprove(v)}
                          disabled={isBusy}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors disabled:opacity-50"
                        >
                          인정
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteModal(v)}
                          disabled={isBusy}
                          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors disabled:opacity-50"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* [삭제] 확인 모달 */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-warm-900/60 backdrop-blur-sm">
          <div className="bg-white border border-warm-200 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="space-y-1">
              <span className="text-[11px] font-mono font-bold text-rose-600 uppercase tracking-wider">
                DELETE RECORD
              </span>
              <h3 className="font-display font-bold text-lg text-warm-900">
                기록 삭제 확인
              </h3>
              <p className="text-xs text-warm-500">
                앱: <strong className="text-warm-800">{deleteTarget.appTitle}</strong> / 유저:{' '}
                <strong className="text-warm-800">{deleteTarget.userNickname}</strong> (점수:{' '}
                <span className="font-mono text-arcade-coral">{deleteTarget.score}</span>)
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 font-bold leading-relaxed">
              이 기록을 삭제합니다. 되돌릴 수 없습니다.
            </div>

            {deleteError && (
              <p className="text-xs font-bold text-rose-600">{deleteError}</p>
            )}

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={processingId === deleteTarget.sessionId}
                className="px-4 py-2.5 rounded-xl bg-warm-100 hover:bg-warm-200 text-xs text-warm-700 font-bold transition-colors"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmDelete()}
                disabled={processingId === deleteTarget.sessionId}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-xs text-white font-bold transition-colors shadow-sm"
              >
                {processingId === deleteTarget.sessionId ? '처리 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 토스트 알림 */}
      <div className="fixed bottom-6 right-6 z-50 space-y-2 pointer-events-none">
        {toasts.map((toast) => {
          const borderStyle =
            toast.type === 'success'
              ? 'border-emerald-500'
              : toast.type === 'warn'
                ? 'border-amber-500'
                : 'border-arcade-coral'
          const icon =
            toast.type === 'success' ? '🎉' : toast.type === 'warn' ? '⚠️' : '⚡'
          return (
            <div
              key={toast.id}
              className={`px-3.5 py-2.5 rounded-2xl bg-white border-2 ${borderStyle} text-warm-900 shadow-xl text-xs font-bold flex items-center gap-2 pointer-events-auto`}
            >
              <span className="text-base">{icon}</span>
              <span>{toast.message}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
