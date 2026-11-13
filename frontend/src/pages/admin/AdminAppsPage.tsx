import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  approveAdminApp,
  deleteAdminApp,
  getAdminApps,
  rejectAdminApp,
} from '../../api/admin'
import type { AppResponse } from '../../api/apps'
import { getErrorMessage } from '../../api/client'
import { formatKstDate } from '../../utils/date'
import { PlayModal } from '../../features/player/PlayModal'
import type { AppStatus } from '../../types'

interface ToastItem {
  id: number
  message: string
  type: 'info' | 'success' | 'warn'
}

export function AdminAppsPage() {
  const [apps, setApps] = useState<AppResponse[]>([])
  const [activeTab, setActiveTab] = useState<AppStatus>('PENDING')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<number | null>(null)

  // 미리보기 PlayModal 상태
  const [previewApp, setPreviewApp] = useState<AppResponse | null>(null)
  const [previewSessionKey, setPreviewSessionKey] = useState(0)

  // 반려 모달 상태
  const [rejectTarget, setRejectTarget] = useState<AppResponse | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectError, setRejectError] = useState<string | null>(null)

  // 강제 삭제 확인 모달 상태
  const [deleteTarget, setDeleteTarget] = useState<AppResponse | null>(null)
  const [deleteConfirmTitle, setDeleteConfirmTitle] = useState('')
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // 알림 토스트
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

  const loadApps = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getAdminApps()
      setApps(data)
    } catch (err) {
      setError(getErrorMessage(err, '앱 목록을 불러오지 못했습니다.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadApps()
  }, [loadApps])

  const counts = useMemo(() => {
    return {
      PENDING: apps.filter((a) => a.status === 'PENDING').length,
      APPROVED: apps.filter((a) => a.status === 'APPROVED').length,
      REJECTED: apps.filter((a) => a.status === 'REJECTED').length,
    }
  }, [apps])

  const filteredApps = useMemo(() => {
    return apps.filter((app) => app.status === activeTab)
  }, [apps, activeTab])

  const renderStatusBadge = (status: AppStatus) => {
    if (status === 'PENDING') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
          승인 대기
        </span>
      )
    }
    if (status === 'APPROVED') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">
          승인됨
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700">
        반려
      </span>
    )
  }

  // [미리보기] 실행
  const handleOpenPreview = (app: AppResponse) => {
    setPreviewSessionKey((prev) => prev + 1)
    setPreviewApp(app)
  }

  // [승인] 처리
  const handleApprove = async (app: AppResponse) => {
    setProcessingId(app.id)
    try {
      await approveAdminApp(app.id)
      showToast(`"${app.title}" 앱이 승인되었습니다.`, 'success')
      await loadApps()
    } catch (err) {
      showToast(getErrorMessage(err, '앱 승인 처리에 실패했습니다.'), 'warn')
    } finally {
      setProcessingId(null)
    }
  }

  // [반려] 모달 열기
  const openRejectModal = (app: AppResponse) => {
    setRejectTarget(app)
    setRejectReason('')
    setRejectError(null)
  }

  // [반려] 확정
  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rejectTarget) return

    const trimmed = rejectReason.trim()
    if (trimmed.length < 1 || trimmed.length > 300) {
      setRejectError('반려 사유는 1~300자로 입력해 주세요.')
      return
    }

    setProcessingId(rejectTarget.id)
    setRejectError(null)
    try {
      await rejectAdminApp(rejectTarget.id, trimmed)
      showToast(`"${rejectTarget.title}" 앱이 반려되었습니다.`, 'info')
      setRejectTarget(null)
      setRejectReason('')
      await loadApps()
    } catch (err) {
      setRejectError(getErrorMessage(err, '앱 반려 처리에 실패했습니다.'))
    } finally {
      setProcessingId(null)
    }
  }

  // [삭제] 모달 열기
  const openDeleteModal = (app: AppResponse) => {
    setDeleteTarget(app)
    setDeleteConfirmTitle('')
    setDeleteError(null)
  }

  // [삭제] 확정
  const handleConfirmDelete = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!deleteTarget) return
    if (deleteConfirmTitle !== deleteTarget.title) return

    setProcessingId(deleteTarget.id)
    setDeleteError(null)
    try {
      await deleteAdminApp(deleteTarget.id)
      showToast(`"${deleteTarget.title}" 앱이 삭제되었습니다.`, 'info')
      setDeleteTarget(null)
      setDeleteConfirmTitle('')
      await loadApps()
    } catch (err) {
      setDeleteError(getErrorMessage(err, '앱 삭제 처리에 실패했습니다.'))
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="space-y-5">
      <section className="bg-white border border-warm-200 rounded-3xl shadow-warm-card overflow-hidden">
        {/* 상단 헤더 & 상태 탭 */}
        <div className="px-6 sm:px-8 pt-6 sm:pt-7 pb-5 border-b border-warm-200/80 space-y-5">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🕹️</span>
              <h2 className="font-display font-extrabold text-xl sm:text-2xl text-warm-900 tracking-tight">
                앱 관리
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-warm-500 mt-1">
              승인 대기 앱을 미리보기로 검수해 승인·반려하고, 문제가 있는 앱을 강제 삭제합니다.
            </p>
          </div>

          {/* 상태 탭: 승인 대기 / 승인됨 / 반려 */}
          <div className="inline-flex flex-wrap rounded-xl bg-warm-100 p-1 border border-warm-200/60 text-xs font-bold gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('PENDING')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === 'PENDING'
                  ? 'bg-arcade-coral text-white shadow-xs'
                  : 'text-warm-600 hover:text-warm-900'
              }`}
            >
              승인 대기 ({counts.PENDING})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('APPROVED')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === 'APPROVED'
                  ? 'bg-arcade-coral text-white shadow-xs'
                  : 'text-warm-600 hover:text-warm-900'
              }`}
            >
              승인됨 ({counts.APPROVED})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('REJECTED')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === 'REJECTED'
                  ? 'bg-arcade-coral text-white shadow-xs'
                  : 'text-warm-600 hover:text-warm-900'
              }`}
            >
              반려 ({counts.REJECTED})
            </button>
          </div>
        </div>

        {/* 본문 표 */}
        {loading ? (
          <div className="py-16 px-6 text-center text-xs font-bold text-warm-400">
            앱 목록을 불러오는 중입니다...
          </div>
        ) : error ? (
          <div className="py-16 px-6 text-center space-y-2">
            <div className="font-display font-bold text-sm text-rose-600">{error}</div>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="py-16 px-6 text-center space-y-1">
            <div className="font-display font-bold text-sm text-warm-700">
              해당 상태의 앱이 없습니다.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-warm-200 bg-warm-50/70 text-warm-500 font-bold">
                  <th className="py-3.5 pl-6 pr-3">제목</th>
                  <th className="py-3.5 px-3">크리에이터</th>
                  <th className="py-3.5 px-3">등록일</th>
                  <th className="py-3.5 px-3">상태</th>
                  {activeTab === 'REJECTED' && <th className="py-3.5 px-3">반려 사유</th>}
                  <th className="py-3.5 pl-3 pr-6 text-right">동작</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-200/80">
                {filteredApps.map((app) => {
                  const isBusy = processingId === app.id
                  return (
                    <tr key={app.id} className="hover:bg-warm-50/60 transition-colors">
                      <td className="py-4 pl-6 pr-3 align-middle">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-warm-900">{app.title}</span>
                          {app.isOfficial && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              공식
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-warm-400 font-mono mt-0.5 truncate max-w-xs">
                          {app.repoUrl} ({app.commitSha ? app.commitSha.slice(0, 7) : '-'})
                        </div>
                      </td>
                      <td className="py-4 px-3 align-middle font-medium text-warm-700">
                        {app.creatorNickname || '-'}
                      </td>
                      <td className="py-4 px-3 align-middle font-mono text-warm-500">
                        {formatKstDate(app.createdAt)}
                      </td>
                      <td className="py-4 px-3 align-middle">{renderStatusBadge(app.status)}</td>
                      {activeTab === 'REJECTED' && (
                        <td className="py-4 px-3 align-middle text-rose-700 font-medium max-w-xs break-words">
                          {app.rejectReason || '-'}
                        </td>
                      )}
                      <td className="py-4 pl-3 pr-6 align-middle text-right">
                        <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenPreview(app)}
                            disabled={isBusy}
                            className="px-3 py-1.5 rounded-xl bg-warm-100 hover:bg-warm-200 text-warm-800 font-bold text-xs transition-colors disabled:opacity-50"
                          >
                            미리보기
                          </button>
                          {activeTab === 'PENDING' && (
                            <>
                              <button
                                type="button"
                                onClick={() => void handleApprove(app)}
                                disabled={isBusy}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors disabled:opacity-50"
                              >
                                승인
                              </button>
                              <button
                                type="button"
                                onClick={() => openRejectModal(app)}
                                disabled={isBusy}
                                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-colors disabled:opacity-50"
                              >
                                반려
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => openDeleteModal(app)}
                            disabled={isBusy}
                            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors disabled:opacity-50"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 미리보기 모달 (PlayModal + GameFrame) */}
      {previewApp && (
        <PlayModal
          key={previewSessionKey}
          open={Boolean(previewApp)}
          appId={previewApp.id}
          title={previewApp.title}
          src={previewApp.playUrl}
          onClose={() => setPreviewApp(null)}
          onNotify={showToast}
        />
      )}

      {/* 반려 사유 입력 모달 */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-warm-900/60 backdrop-blur-sm">
          <form
            onSubmit={handleConfirmReject}
            className="bg-white border border-warm-200 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl"
          >
            <div className="space-y-1">
              <span className="text-[11px] font-mono font-bold text-amber-600 uppercase tracking-wider">
                REJECT APP
              </span>
              <h3 className="font-display font-bold text-lg text-warm-900">
                앱 반려 사유 입력
              </h3>
              <p className="text-xs text-warm-500">
                대상 앱: <strong className="text-warm-800">{rejectTarget.title}</strong>
              </p>
            </div>

            <div>
              <label htmlFor="reject-reason" className="block text-xs font-bold text-warm-700 mb-1.5">
                반려 사유 (필수, 1~300자) <span className="text-arcade-coral">*</span>
              </label>
              <textarea
                id="reject-reason"
                rows={4}
                maxLength={300}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="크리에이터가 확인할 수 있도록 반려 사유를 입력해 주세요 (최대 300자)."
                className="w-full bg-warm-50 border border-warm-200 rounded-xl p-3 text-xs text-warm-800 resize-none focus:outline-none focus:bg-white focus:border-arcade-coral"
              />
              <div className="flex justify-between items-center mt-1 text-[11px] text-warm-400">
                <span>사유를 입력해야 반려할 수 있습니다.</span>
                <span className="font-mono">{rejectReason.trim().length} / 300</span>
              </div>
              {rejectError && (
                <p className="mt-1.5 text-xs font-bold text-rose-600">{rejectError}</p>
              )}
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                disabled={processingId === rejectTarget.id}
                className="px-4 py-2.5 rounded-xl bg-warm-100 hover:bg-warm-200 text-xs text-warm-700 font-bold transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={
                  processingId === rejectTarget.id ||
                  rejectReason.trim().length < 1 ||
                  rejectReason.trim().length > 300
                }
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-xs text-white font-bold transition-colors shadow-sm"
              >
                {processingId === rejectTarget.id ? '처리 중...' : '반려하기'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 강제 삭제 확인 모달 (앱 제목 똑같이 입력) */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-warm-900/60 backdrop-blur-sm">
          <form
            onSubmit={handleConfirmDelete}
            className="bg-white border border-warm-200 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl"
          >
            <div className="space-y-1">
              <span className="text-[11px] font-mono font-bold text-rose-600 uppercase tracking-wider">
                FORCE DELETE APP
              </span>
              <h3 className="font-display font-bold text-lg text-warm-900">
                앱 강제 삭제 확인
              </h3>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-bold leading-relaxed">
              이 앱과 리더보드, 앱 댓글이 모두 삭제되며 되돌릴 수 없습니다.
            </div>

            <div className="space-y-1.5 text-xs">
              <label htmlFor="delete-confirm-title" className="block text-warm-700 font-medium">
                삭제를 확인하려면 아래에 앱 제목{' '}
                <strong className="font-extrabold text-warm-900 select-all">
                  {deleteTarget.title}
                </strong>
                을(를) 똑같이 입력해 주세요.
              </label>
              <input
                id="delete-confirm-title"
                type="text"
                value={deleteConfirmTitle}
                onChange={(e) => setDeleteConfirmTitle(e.target.value)}
                placeholder={deleteTarget.title}
                className="w-full bg-warm-50 border border-warm-200 rounded-xl p-3 text-xs text-warm-800 focus:outline-none focus:bg-white focus:border-rose-500"
              />
              {deleteError && (
                <p className="mt-1.5 text-xs font-bold text-rose-600">{deleteError}</p>
              )}
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={processingId === deleteTarget.id}
                className="px-4 py-2.5 rounded-xl bg-warm-100 hover:bg-warm-200 text-xs text-warm-700 font-bold transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={
                  processingId === deleteTarget.id ||
                  deleteConfirmTitle !== deleteTarget.title
                }
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-xs text-white font-bold transition-colors shadow-sm"
              >
                {processingId === deleteTarget.id ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </form>
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
