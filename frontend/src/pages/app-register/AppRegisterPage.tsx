import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/useAuth'

export function AppRegisterPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [appType, setAppType] = useState<'USER' | 'OFFICIAL'>('USER')
  const [tag, setTag] = useState('')
  const [repoUrl, setRepoUrl] = useState('')
  const [entryPath, setEntryPath] = useState('index.html')
  const [maxScore, setMaxScore] = useState('')
  const [description, setDescription] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSubmitted(true)
    setTimeout(() => {
      navigate('/apps')
    }, 1500)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <Link
          to="/apps"
          className="inline-flex items-center gap-2 text-xs font-bold text-warm-500 hover:text-warm-800 transition-colors"
        >
          ← 앱 탐색 목록으로 돌아가기
        </Link>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-warm-200 rounded-3xl p-6 sm:p-8 space-y-5 shadow-warm-card"
      >
        <div className="flex items-center justify-between border-b border-warm-200 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🚀</span>
            <div>
              <h1 className="font-display font-extrabold text-xl text-warm-900">
                새 타이니앱 등록하기
              </h1>
              <p className="text-xs text-warm-500 mt-0.5">
                바이브코딩으로 만든 16:10 웹 게임을 등록하고 리더보드를 열어보세요.
              </p>
            </div>
          </div>
          <Link
            to="/guide"
            className="px-3 py-1.5 rounded-xl bg-warm-100 hover:bg-warm-200 text-xs font-bold text-warm-700 transition-colors"
          >
            📘 연동 가이드 보기
          </Link>
        </div>

        {submitted && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
            🎉 &apos;{title}&apos; 타이니앱이 성공적으로 등록 신청되었습니다! (승인 대기 상태로 전환)
          </div>
        )}

        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-warm-700 mb-1.5">
              앱 제목 <span className="text-arcade-coral">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 알고리즘 던전 탈출기"
              className="w-full bg-warm-50 border border-warm-200 rounded-xl p-3 text-xs text-warm-800 focus:outline-none focus:bg-white focus:border-arcade-coral"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-warm-700 mb-1.5">앱 유형</label>
              <select
                value={appType}
                onChange={(e) => setAppType(e.target.value as 'USER' | 'OFFICIAL')}
                disabled={user?.role !== 'ADMIN'}
                className="w-full bg-warm-50 border border-warm-200 rounded-xl p-3 text-xs text-warm-800 disabled:opacity-70"
              >
                <option value="USER">유저 창작 앱 (USER)</option>
                <option value="OFFICIAL">공식 코딩학습 (ADMIN 전용)</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-warm-700 mb-1.5">
                프로그래밍 언어 / 태그
              </label>
              <input
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="예: JavaScript, Python"
                className="w-full bg-warm-50 border border-warm-200 rounded-xl p-3 text-xs text-warm-800 focus:outline-none focus:bg-white focus:border-arcade-coral"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block font-bold text-warm-700 mb-1.5">
                GitHub 저장소 URL <span className="text-arcade-coral">*</span>
              </label>
              <input
                type="url"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/username/my-tiny-app"
                className="w-full bg-warm-50 border border-warm-200 rounded-xl p-3 text-xs font-mono text-warm-800 focus:outline-none focus:bg-white focus:border-arcade-coral"
              />
            </div>
            <div>
              <label className="block font-bold text-warm-700 mb-1.5">진입 HTML 경로</label>
              <input
                type="text"
                value={entryPath}
                onChange={(e) => setEntryPath(e.target.value)}
                placeholder="index.html"
                className="w-full bg-warm-50 border border-warm-200 rounded-xl p-3 text-xs font-mono text-warm-800 focus:outline-none focus:bg-white focus:border-arcade-coral"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-warm-700 mb-1.5">
              최고 점수 상한 (`max_score`, 선택)
            </label>
            <input
              type="number"
              value={maxScore}
              onChange={(e) => setMaxScore(e.target.value)}
              placeholder="고정 만점이 있는 경우 입력 (비워두면 Z-score 통계 검증만 적용)"
              className="w-full bg-warm-50 border border-warm-200 rounded-xl p-3 text-xs font-mono text-warm-800 focus:outline-none focus:bg-white focus:border-arcade-coral"
            />
          </div>

          <div>
            <label className="block font-bold text-warm-700 mb-1.5">앱 소개 및 플레이 방법</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="게임 규칙과 하이스코어 획득 방법을 적어주세요."
              className="w-full bg-warm-50 border border-warm-200 rounded-xl p-3 text-xs text-warm-800 resize-none focus:outline-none focus:bg-white focus:border-arcade-coral"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-warm-100 border border-warm-200 text-[11px] text-warm-600 space-y-1">
            <div className="font-bold text-warm-800">📌 타이니앱 규격 가이드:</div>
            <div>• 해상도: 16:10 비율 (기본 800 × 500 px iframe 모달 실행)</div>
            <div>• 점수 연동: 게임 완료 시 postMessage SDK로 최종 점수를 제출하면 리더보드에 반영됩니다.</div>
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-2">
          <Link
            to="/apps"
            className="px-4 py-2.5 rounded-xl bg-warm-100 hover:bg-warm-200 text-xs text-warm-700 font-bold transition-colors"
          >
            취소
          </Link>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-arcade-coral hover:bg-arcade-coralHover text-white text-xs font-bold shadow-btn-play transition-all"
          >
            등록 신청 완료
          </button>
        </div>
      </form>
    </div>
  )
}
