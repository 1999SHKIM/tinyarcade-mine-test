import { useCallback, useEffect, useState } from 'react'
import {
  closeWeek,
  getClosePreview,
  getCloseWeeks,
  getMockSetting,
  setMockSetting,
  type CloseResult,
  type CloseWeekItem,
} from '../../api/admin'
import { getErrorMessage } from '../../api/client'

export function AdminClosePage() {
  // ① 목데이터 토글 상태
  const [mockEnabled, setMockEnabled] = useState<boolean | null>(null)
  const [mockLoading, setMockLoading] = useState(false)
  const [mockError, setMockError] = useState<string | null>(null)

  // ② 이번 주 미리보기 상태
  const [previewResult, setPreviewResult] = useState<CloseResult | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

  // ③ 지난 주차 목록 & 재마감 상태
  const [weeks, setWeeks] = useState<CloseWeekItem[]>([])
  const [weeksLoading, setWeeksLoading] = useState(false)
  const [weeksError, setWeeksError] = useState<string | null>(null)

  // 재마감 모달 & 실행 상태
  const [modalWeekKey, setModalWeekKey] = useState<string | null>(null)
  const [recloseLoading, setRecloseLoading] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)
  const [lastClosedResult, setLastClosedResult] = useState<CloseResult | null>(null)

  // 초기 목데이터 설정 & 주차 목록 불러오기
  const loadMockSetting = useCallback(async () => {
    try {
      const res = await getMockSetting()
      setMockEnabled(res.enabled)
    } catch (err) {
      setMockError(getErrorMessage(err, '목데이터 설정을 불러오지 못했습니다.'))
    }
  }, [])

  const loadWeeks = useCallback(async () => {
    setWeeksLoading(true)
    setWeeksError(null)
    try {
      const data = await getCloseWeeks()
      setWeeks(data)
    } catch (err) {
      setWeeksError(getErrorMessage(err, '지난 주차 목록을 불러오지 못했습니다.'))
    } finally {
      setWeeksLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadMockSetting()
    void loadWeeks()
  }, [loadMockSetting, loadWeeks])

  // ① 목데이터 토글 핸들러
  const handleToggleMock = async () => {
    if (mockEnabled === null || mockLoading) return
    setMockLoading(true)
    setMockError(null)
    try {
      const nextState = !mockEnabled
      const res = await setMockSetting(nextState)
      setMockEnabled(res.enabled)
    } catch (err) {
      setMockError(getErrorMessage(err, '목데이터 설정을 변경하지 못했습니다.'))
    } finally {
      setMockLoading(false)
    }
  };

  // ② 이번 주 미리보기 핸들러
  const handlePreview = async () => {
    setPreviewLoading(true)
    setPreviewError(null)
    try {
      const res = await getClosePreview()
      setPreviewResult(res)
    } catch (err) {
      setPreviewError(getErrorMessage(err, '마감 미리보기를 불러오지 못했습니다.'))
    } finally {
      setPreviewLoading(false)
    }
  }

  // ③ 재마감 모달 열기
  const openRecloseModal = (periodKey: string) => {
    setModalWeekKey(periodKey)
    setModalError(null)
  }

  // ③ 재마감 실행 핸들러
  const handleConfirmReclose = async () => {
    if (!modalWeekKey || recloseLoading) return
    setRecloseLoading(true)
    setModalError(null)
    try {
      const result = await closeWeek(modalWeekKey)
      setLastClosedResult(result)
      setModalWeekKey(null)
      await loadWeeks()
    } catch (err) {
      setModalError(getErrorMessage(err, '주차 재마감에 실패했습니다.'))
    } finally {
      setRecloseLoading(false)
    }
  }

  // 공통 결과 표 렌더러
  const renderRecordsTable = (result: CloseResult, isPreview: boolean) => (
    <div className="space-y-3 pt-2">
      <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-2xl bg-warm-50 border border-warm-200/80 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono font-bold text-warm-900 bg-white px-2.5 py-1 rounded-lg border border-warm-200">
            주차: {result.periodKey}
          </span>
          <span className="text-warm-700">
            목 앱 포함 여부:{' '}
            <strong className={result.mockIncluded ? 'text-emerald-700 font-bold' : 'text-warm-700 font-bold'}>
              {result.mockIncluded ? '포함' : '미포함'}
            </strong>
          </span>
          <span className="text-warm-700">
            비교한 앱 수: <strong className="font-mono font-bold text-warm-900">{result.appCount}개</strong>
          </span>
        </div>
        {isPreview && (
          <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/80">
            ⚠️ 저장되지 않은 미리보기입니다.
          </span>
        )}
      </div>

      {result.records.length === 0 ? (
        <div className="py-8 text-center text-xs font-bold text-warm-400 bg-warm-50/50 rounded-2xl border border-dashed border-warm-200">
          아직 1등 기록이 없습니다.
        </div>
      ) : (
        <div className="overflow-x-auto border border-warm-200/80 rounded-2xl">
          <table className="w-full text-left border-collapse">
            <thead className="bg-warm-50/75 border-b border-warm-200/80 text-[11px] font-mono font-bold text-warm-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">앱</th>
                <th className="py-3 px-4">1등</th>
                <th className="py-3 px-4 text-right">추천 수</th>
                <th className="py-3 px-4 text-right">참여자 수</th>
                <th className="py-3 px-4 text-right">계수</th>
                <th className="py-3 px-4 text-right">포인트</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100 text-xs text-warm-800">
              {result.records.map((r) => (
                <tr key={r.appId} className="hover:bg-warm-50/50 transition-colors">
                  <td className="py-3 px-4 font-bold text-warm-900">{r.appTitle}</td>
                  <td className="py-3 px-4">{r.nickname}</td>
                  <td className="py-3 px-4 text-right font-mono">{r.recommendAtClose.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right font-mono">{r.participantsAtClose.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right font-mono">
                    {typeof r.coefficient === 'number' ? r.coefficient.toFixed(4) : r.coefficient}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-arcade-coral">
                    {typeof r.points === 'number' ? r.points.toFixed(2) : r.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* ① 목데이터 토글 섹션 */}
      <section className="bg-white border border-warm-200 rounded-3xl shadow-warm-card overflow-hidden">
        <div className="px-6 sm:px-8 py-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">⚙️</span>
                <h2 className="font-display font-extrabold text-xl text-warm-900 tracking-tight">
                  목데이터 토글
                </h2>
                {mockEnabled !== null && (
                  <span
                    className={`ml-2 text-xs font-bold px-2.5 py-1 rounded-full border ${
                      mockEnabled
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-warm-100 border-warm-200 text-warm-600'
                    }`}
                  >
                    현재 상태: {mockEnabled ? '켜짐' : '꺼짐'}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-warm-600 mt-2 leading-relaxed max-w-2xl">
                켜면 다음 마감부터 목 앱이 비교 대상에 들어갑니다. 이미 만든 기록은 바뀌지 않습니다.
                반영하려면 아래에서 지난 주차를 재마감하세요.
              </p>
            </div>

            <div>
              <button
                type="button"
                onClick={handleToggleMock}
                disabled={mockLoading || mockEnabled === null}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-xs disabled:opacity-50 ${
                  mockEnabled
                    ? 'bg-warm-200 hover:bg-warm-300 text-warm-800'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {mockLoading ? '처리 중...' : mockEnabled ? '끄기' : '켜기'}
              </button>
            </div>
          </div>

          {mockError && <p className="text-xs font-bold text-rose-600">{mockError}</p>}
        </div>
      </section>

      {/* ② 이번 주 미리보기 섹션 */}
      <section className="bg-white border border-warm-200 rounded-3xl shadow-warm-card overflow-hidden">
        <div className="px-6 sm:px-8 py-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🔍</span>
                <h2 className="font-display font-extrabold text-xl text-warm-900 tracking-tight">
                  이번 주 미리보기
                </h2>
              </div>
              <p className="text-xs text-warm-500 mt-1">
                현재 주차의 진행 중인 순위 데이터를 바탕으로 마감 결과를 미리 계산합니다. (DB에 저장되지 않음)
              </p>
            </div>

            <button
              type="button"
              onClick={handlePreview}
              disabled={previewLoading}
              className="px-5 py-2.5 rounded-xl bg-arcade-coral hover:bg-arcade-coral/90 text-white font-bold text-xs transition-colors shadow-xs disabled:opacity-50"
            >
              {previewLoading ? '계산 중...' : '미리보기'}
            </button>
          </div>

          {previewError && <p className="text-xs font-bold text-rose-600">{previewError}</p>}

          {previewResult && renderRecordsTable(previewResult, true)}
        </div>
      </section>

      {/* ③ 지난 주차 재마감 섹션 */}
      <section className="bg-white border border-warm-200 rounded-3xl shadow-warm-card overflow-hidden">
        <div className="px-6 sm:px-8 py-6 space-y-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">📅</span>
              <h2 className="font-display font-extrabold text-xl text-warm-900 tracking-tight">
                지난 주차 재마감
              </h2>
            </div>
            <p className="text-xs text-warm-500 mt-1">
              종료된 최근 8개 주차의 마감 여부를 확인하고 필요 시 최신 데이터를 반영해 재마감합니다.
            </p>
          </div>

          {weeksError && <p className="text-xs font-bold text-rose-600">{weeksError}</p>}

          {weeksLoading ? (
            <div className="py-12 text-center text-xs font-bold text-warm-400">
              주차 목록을 불러오는 중입니다...
            </div>
          ) : weeks.length === 0 ? (
            <div className="py-8 text-center text-xs font-bold text-warm-400">
              표시할 지난 주차가 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto border border-warm-200/80 rounded-2xl">
              <table className="w-full text-left border-collapse">
                <thead className="bg-warm-50/75 border-b border-warm-200/80 text-[11px] font-mono font-bold text-warm-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">주차 키</th>
                    <th className="py-3 px-4">마감 여부</th>
                    <th className="py-3 px-4 text-right">작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-100 text-xs text-warm-800">
                  {weeks.map((w) => (
                    <tr key={w.periodKey} className="hover:bg-warm-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-warm-900">
                        {w.periodKey}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            w.closed
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-warm-100 text-warm-600 border border-warm-200'
                          }`}
                        >
                          {w.closed ? '마감됨' : '미마감'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => openRecloseModal(w.periodKey)}
                          disabled={recloseLoading}
                          className="px-3.5 py-1.5 rounded-lg bg-warm-100 hover:bg-arcade-coral hover:text-white text-warm-800 font-bold text-xs transition-colors disabled:opacity-50"
                        >
                          재마감
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 가장 최근 재마감 결과 표시 */}
          {lastClosedResult && (
            <div className="pt-4 border-t border-warm-200/80 space-y-2">
              <h3 className="font-display font-bold text-base text-warm-900">
                재마감 완료 결과 ({lastClosedResult.periodKey})
              </h3>
              {renderRecordsTable(lastClosedResult, false)}
            </div>
          )}
        </div>
      </section>

      {/* 재마감 확인 모달 */}
      {modalWeekKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-warm-900/60 backdrop-blur-sm">
          <div className="bg-white border border-warm-200 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="space-y-1">
              <span className="text-[11px] font-mono font-bold text-arcade-coral uppercase tracking-wider">
                RE-CLOSE WEEK
              </span>
              <h3 className="font-display font-bold text-lg text-warm-900">
                {modalWeekKey} 주차 재마감 확인
              </h3>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
              {modalWeekKey}의 마감 결과를 지우고 지금 데이터로 다시 계산합니다. 삭제된 앱의 기록은 그대로 남습니다.
            </div>

            {modalError && <p className="text-xs font-bold text-rose-600">{modalError}</p>}

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setModalWeekKey(null)}
                disabled={recloseLoading}
                className="px-4 py-2.5 rounded-xl bg-warm-100 hover:bg-warm-200 text-xs text-warm-700 font-bold transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmReclose}
                disabled={recloseLoading}
                className="px-4 py-2.5 rounded-xl bg-arcade-coral hover:bg-arcade-coral/90 text-xs text-white font-bold transition-colors shadow-sm disabled:opacity-50"
              >
                {recloseLoading ? '재마감 중...' : '확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
