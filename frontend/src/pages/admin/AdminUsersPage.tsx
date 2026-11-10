import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  activateAdminUser,
  getAdminUsers,
  suspendAdminUser,
  type AdminUserResponse,
} from '../../api/admin'
import { getErrorMessage } from '../../api/client'
import type { UserRole, UserStatus } from '../../types'

type UserFilterStatus = 'ALL' | UserStatus

interface ToastItem {
  id: number
  message: string
  type: 'info' | 'success' | 'warn'
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserResponse[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<UserFilterStatus>('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<number | null>(null)

  // [정지] 확인 모달 대상 유저
  const [suspendTarget, setSuspendTarget] = useState<AdminUserResponse | null>(null)
  const [suspendError, setSuspendError] = useState<string | null>(null)

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

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getAdminUsers()
      setUsers(data)
    } catch (err) {
      setError(getErrorMessage(err, '유저 목록을 불러오지 못했습니다.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  const counts = useMemo(() => {
    return {
      ALL: users.length,
      ACTIVE: users.filter((u) => u.status === 'ACTIVE').length,
      SUSPENDED: users.filter((u) => u.status === 'SUSPENDED').length,
      WITHDRAWN: users.filter((u) => u.status === 'WITHDRAWN').length,
    }
  }, [users])

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return users.filter((u) => {
      if (statusFilter !== 'ALL' && u.status !== statusFilter) return false
      if (q) {
        const hay = `${u.nickname} ${u.email}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [users, statusFilter, searchQuery])

  const formatDate = (iso?: string | null) => {
    if (!iso) return '-'
    return iso.slice(0, 10)
  }

  const renderRoleBadge = (role: UserRole) => {
    if (role === 'ADMIN') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
          관리자
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-warm-100 text-warm-700">
        회원
      </span>
    )
  }

  const renderStatusBadge = (status: UserStatus) => {
    if (status === 'ACTIVE') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">
          활성
        </span>
      )
    }
    if (status === 'SUSPENDED') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700">
          정지
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-warm-200 text-warm-600">
        탈퇴
      </span>
    )
  }

  // [정지] 모달 열기
  const openSuspendModal = (user: AdminUserResponse) => {
    setSuspendTarget(user)
    setSuspendError(null)
  }

  // [정지] 확정
  const handleConfirmSuspend = async () => {
    if (!suspendTarget) return
    setProcessingId(suspendTarget.id)
    setSuspendError(null)
    try {
      await suspendAdminUser(suspendTarget.id)
      showToast(`"${suspendTarget.nickname}" 유저가 정지 처리되었습니다.`, 'info')
      setSuspendTarget(null)
      await loadUsers()
    } catch (err) {
      setSuspendError(getErrorMessage(err, '유저 정지 처리에 실패했습니다.'))
    } finally {
      setProcessingId(null)
    }
  }

  // [해제] 처리
  const handleActivate = async (user: AdminUserResponse) => {
    setProcessingId(user.id)
    try {
      await activateAdminUser(user.id)
      showToast(`"${user.nickname}" 유저의 정지가 해제되었습니다.`, 'success')
      await loadUsers()
    } catch (err) {
      showToast(getErrorMessage(err, '정지 해제 처리에 실패했습니다.'), 'warn')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="space-y-5">
      <section className="bg-white border border-warm-200 rounded-3xl shadow-warm-card overflow-hidden">
        {/* 상단 헤더 & 필터·검색 툴바 */}
        <div className="px-6 sm:px-8 pt-6 sm:pt-7 pb-5 border-b border-warm-200/80 space-y-5">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">👥</span>
              <h2 className="font-display font-extrabold text-xl sm:text-2xl text-warm-900 tracking-tight">
                유저 관리
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-warm-500 mt-1">
              전체 회원 목록을 검색·필터하고 이용 정지 및 정지 해제를 처리합니다.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
            {/* 상태 필터: 전체 / 활성 / 정지 / 탈퇴 */}
            <div className="inline-flex flex-wrap rounded-xl bg-warm-100 p-1 border border-warm-200/60 text-xs font-bold gap-1 self-start">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-3.5 py-2 rounded-lg transition-all ${
                  statusFilter === 'ALL'
                    ? 'bg-arcade-coral text-white shadow-xs'
                    : 'text-warm-600 hover:text-warm-900'
                }`}
              >
                전체 ({counts.ALL})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('ACTIVE')}
                className={`px-3.5 py-2 rounded-lg transition-all ${
                  statusFilter === 'ACTIVE'
                    ? 'bg-arcade-coral text-white shadow-xs'
                    : 'text-warm-600 hover:text-warm-900'
                }`}
              >
                활성 ({counts.ACTIVE})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('SUSPENDED')}
                className={`px-3.5 py-2 rounded-lg transition-all ${
                  statusFilter === 'SUSPENDED'
                    ? 'bg-arcade-coral text-white shadow-xs'
                    : 'text-warm-600 hover:text-warm-900'
                }`}
              >
                정지 ({counts.SUSPENDED})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('WITHDRAWN')}
                className={`px-3.5 py-2 rounded-lg transition-all ${
                  statusFilter === 'WITHDRAWN'
                    ? 'bg-arcade-coral text-white shadow-xs'
                    : 'text-warm-600 hover:text-warm-900'
                }`}
              >
                탈퇴 ({counts.WITHDRAWN})
              </button>
            </div>

            {/* 검색창 (닉네임·이메일) */}
            <div className="relative w-full lg:w-72">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="닉네임 또는 이메일 검색..."
                className="w-full bg-warm-50 border border-warm-200 rounded-xl pl-8 pr-3 py-2 text-xs text-warm-800 placeholder-warm-400 focus:outline-none focus:bg-white focus:border-arcade-coral transition-all"
              />
              <svg
                className="w-3.5 h-3.5 text-warm-400 absolute left-3 top-2.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* 유저 표 */}
        {loading ? (
          <div className="py-16 px-6 text-center text-xs font-bold text-warm-400">
            유저 목록을 불러오는 중입니다...
          </div>
        ) : error ? (
          <div className="py-16 px-6 text-center space-y-2">
            <div className="font-display font-bold text-sm text-rose-600">{error}</div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 px-6 text-center space-y-1">
            <div className="font-display font-bold text-sm text-warm-700">
              조건에 맞는 유저가 없습니다.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-warm-200 bg-warm-50/70 text-warm-500 font-bold">
                  <th className="py-3.5 pl-6 pr-3">닉네임</th>
                  <th className="py-3.5 px-3">이메일</th>
                  <th className="py-3.5 px-3">역할</th>
                  <th className="py-3.5 px-3">상태</th>
                  <th className="py-3.5 px-3">가입일</th>
                  <th className="py-3.5 pl-3 pr-6 text-right">동작</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-200/80">
                {filteredUsers.map((u) => {
                  const isBusy = processingId === u.id
                  const isAdminRole = u.role === 'ADMIN'
                  const isWithdrawn = u.status === 'WITHDRAWN'

                  return (
                    <tr key={u.id} className="hover:bg-warm-50/60 transition-colors">
                      <td className="py-4 pl-6 pr-3 align-middle font-bold text-sm text-warm-900">
                        {u.nickname}
                      </td>
                      <td className="py-4 px-3 align-middle font-mono text-warm-600">
                        {u.email}
                      </td>
                      <td className="py-4 px-3 align-middle">{renderRoleBadge(u.role)}</td>
                      <td className="py-4 px-3 align-middle">{renderStatusBadge(u.status)}</td>
                      <td className="py-4 px-3 align-middle font-mono text-warm-500">
                        {formatDate(u.createdAt)}
                      </td>
                      <td className="py-4 pl-3 pr-6 align-middle text-right">
                        {!isAdminRole && !isWithdrawn && (
                          <>
                            {u.status === 'ACTIVE' && (
                              <button
                                type="button"
                                onClick={() => openSuspendModal(u)}
                                disabled={isBusy}
                                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors disabled:opacity-50"
                              >
                                정지
                              </button>
                            )}
                            {u.status === 'SUSPENDED' && (
                              <button
                                type="button"
                                onClick={() => void handleActivate(u)}
                                disabled={isBusy}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors disabled:opacity-50"
                              >
                                해제
                              </button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* [정지] 확인 모달 */}
      {suspendTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-warm-900/60 backdrop-blur-sm">
          <div className="bg-white border border-warm-200 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="space-y-1">
              <span className="text-[11px] font-mono font-bold text-rose-600 uppercase tracking-wider">
                SUSPEND USER
              </span>
              <h3 className="font-display font-bold text-lg text-warm-900">
                유저 정지 확인
              </h3>
              <p className="text-xs text-warm-500">
                대상: <strong className="text-warm-800">{suspendTarget.nickname}</strong> (
                <span className="font-mono">{suspendTarget.email}</span>)
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-bold leading-relaxed">
              이 유저는 로그인과 글쓰기·플레이 기록이 막힙니다. 기존 기록은 유지됩니다.
            </div>

            {suspendError && (
              <p className="text-xs font-bold text-rose-600">{suspendError}</p>
            )}

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setSuspendTarget(null)}
                disabled={processingId === suspendTarget.id}
                className="px-4 py-2.5 rounded-xl bg-warm-100 hover:bg-warm-200 text-xs text-warm-700 font-bold transition-colors"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmSuspend()}
                disabled={processingId === suspendTarget.id}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-xs text-white font-bold transition-colors shadow-sm"
              >
                {processingId === suspendTarget.id ? '처리 중...' : '정지'}
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
