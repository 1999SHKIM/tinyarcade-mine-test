import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { registerApp, type AppRegisterRequest, type AppResponse } from '../../api/apps'
import { getErrorMessage } from '../../api/client'
import { useAuth } from '../../features/auth/useAuth'

const GITHUB_REPO_REGEX = /^https:\/\/github\.com\/([A-Za-z0-9-]+)\/([A-Za-z0-9._-]+?)(?:\.git)?\/?$/
const ENTRY_PATH_REGEX = /^(?!\/)(?!.*\.\.)(?!.*\\)[^?#]*\.html$/
const MAX_SCORE_REGEX = /^\d{1,12}(\.\d{1,2})?$/

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const MAX_THUMBNAIL_BYTES = 500 * 1024 // 500KB

interface FieldErrors {
  title?: string
  description?: string
  repoUrl?: string
  entryPath?: string
  maxScore?: string
}

interface ThumbnailFieldProps {
  previewUrl: string | null
  fileName: string | null
  onSelect: (file: File | null, previewUrl: string | null) => void
}

function ThumbnailField({ previewUrl, fileName, onSelect }: ThumbnailFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFile = (file: File | undefined | null) => {
    if (!file) return

    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    const isValidType =
      ALLOWED_IMAGE_TYPES.includes(file.type) || ['png', 'jpg', 'jpeg', 'webp'].includes(ext)
    if (!isValidType || ext === 'gif' || file.type === 'image/gif') {
      setError('썸네일은 png, jpg, webp 형식만 등록할 수 있습니다.')
      onSelect(null, null)
      if (inputRef.current) inputRef.current.value = ''
      return
    }

    if (file.size > MAX_THUMBNAIL_BYTES) {
      setError('썸네일 파일 크기는 최대 500KB 이하여야 합니다.')
      onSelect(null, null)
      if (inputRef.current) inputRef.current.value = ''
      return
    }

    setError(null)
    const objectUrl = URL.createObjectURL(file)
    onSelect(file, objectUrl)
  }

  const handleClear = () => {
    setError(null)
    onSelect(null, null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block font-bold text-warm-700">썸네일 (선택)</label>
        <span className="text-[11px] font-bold text-warm-500 bg-warm-100 px-2 py-0.5 rounded-lg">
          PNG, JPG, WEBP (최대 500KB)
        </span>
      </div>

      {previewUrl ? (
        <div className="flex items-center gap-4 p-3 rounded-2xl bg-warm-50 border border-warm-200">
          <img
            src={previewUrl}
            alt="썸네일 미리보기"
            className="w-28 h-20 object-cover rounded-xl border border-warm-200 bg-white shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-warm-800 truncate">{fileName}</p>
            <p className="text-[11px] text-warm-500 mt-0.5">선택된 썸네일 미리보기</p>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="px-3 py-1.5 rounded-xl bg-warm-200 hover:bg-warm-300 text-xs font-bold text-warm-700 transition-colors shrink-0"
          >
            삭제
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setIsDragging(false)
            handleFile(e.dataTransfer.files?.[0])
          }}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer border-2 border-dashed rounded-2xl p-5 text-center transition-colors ${
            isDragging
              ? 'border-arcade-coral bg-arcade-coral/5'
              : 'border-warm-300 bg-warm-50 hover:border-warm-400'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
            onChange={(e) => handleFile(e.target.files?.[0])}
            className="hidden"
          />
          <p className="text-xs font-bold text-warm-700">
            클릭하여 이미지 선택 또는 여기로 끌어다 놓기
          </p>
          <p className="text-[11px] text-warm-500 mt-1">PNG, JPG, WEBP (최대 500KB)</p>
        </div>
      )}

      {error && <p className="mt-1.5 text-xs font-bold text-red-600">{error}</p>}
    </div>
  )
}

export function AppRegisterPage() {
  const { isAuthenticated, isLoading } = useAuth()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [repoUrl, setRepoUrl] = useState('')
  const [entryPath, setEntryPath] = useState('dist/index.html')
  const [maxScore, setMaxScore] = useState('')

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(null)
  const [thumbnailFileName, setThumbnailFileName] = useState<string | null>(null)

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [registeredApp, setRegisteredApp] = useState<AppResponse | null>(null)

  useEffect(() => {
    return () => {
      if (thumbnailPreviewUrl) {
        URL.revokeObjectURL(thumbnailPreviewUrl)
      }
    }
  }, [thumbnailPreviewUrl])

  const handleThumbnailSelect = (file: File | null, previewUrl: string | null) => {
    if (thumbnailPreviewUrl) {
      URL.revokeObjectURL(thumbnailPreviewUrl)
    }
    setThumbnailFile(file)
    setThumbnailPreviewUrl(previewUrl)
    setThumbnailFileName(file ? file.name : null)
  }

  const validateForm = (): FieldErrors => {
    const errors: FieldErrors = {}
    const trimmedTitle = title.trim()
    const trimmedDesc = description.trim()
    const trimmedRepo = repoUrl.trim()
    const trimmedEntry = entryPath.trim() === '' ? 'dist/index.html' : entryPath.trim()
    const trimmedMaxScore = maxScore.trim()

    if (trimmedTitle.length < 1 || trimmedTitle.length > 100) {
      errors.title = '앱 제목은 앞뒤 공백 제외 1~100자로 입력해 주세요.'
    }

    if (trimmedDesc.length < 1 || trimmedDesc.length > 500) {
      errors.description = '설명은 앞뒤 공백 제외 1~500자로 입력해 주세요.'
    }

    if (
      !trimmedRepo ||
      trimmedRepo.length > 300 ||
      !GITHUB_REPO_REGEX.test(trimmedRepo)
    ) {
      errors.repoUrl =
        'https://github.com/{owner}/{repo} 형식(최대 300자)으로 입력해 주세요.'
    }

    if (
      trimmedEntry.length > 200 ||
      !ENTRY_PATH_REGEX.test(trimmedEntry)
    ) {
      errors.entryPath =
        '진입 HTML 경로는 .html로 끝나야 하며, .. 나 \\ 또는 맨 앞 / 를 사용할 수 없습니다 (최대 200자).'
    }

    if (trimmedMaxScore !== '') {
      const num = Number(trimmedMaxScore)
      if (Number.isNaN(num) || num < 0 || !MAX_SCORE_REGEX.test(trimmedMaxScore)) {
        errors.maxScore = '최고 점수는 0 이상, 소수 둘째 자리까지 입력해 주세요.'
      }
    }

    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)

    const errors = validateForm()
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      return
    }

    const effectiveEntryPath = entryPath.trim() === '' ? 'dist/index.html' : entryPath.trim()
    const payload: AppRegisterRequest = {
      title: title.trim(),
      description: description.trim(),
      repoUrl: repoUrl.trim(),
      entryPath: effectiveEntryPath,
    }

    if (maxScore.trim() !== '') {
      payload.maxScore = Number(maxScore.trim())
    }

    setIsSubmitting(true)
    try {
      const result = await registerApp(payload, thumbnailFile)
      setRegisteredApp(result)
    } catch (err) {
      setServerError(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setTitle('')
    setDescription('')
    setRepoUrl('')
    setEntryPath('dist/index.html')
    setMaxScore('')
    setThumbnailFile(null)
    handleThumbnailSelect(null, null)
    setFieldErrors({})
    setServerError(null)
    setRegisteredApp(null)
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center text-xs font-bold text-warm-500">
        불러오는 중...
      </div>
    )
  }

  if (!isAuthenticated) {
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

        <div className="bg-white border border-warm-200 rounded-3xl p-8 text-center space-y-4 shadow-warm-card">
          <div className="text-3xl">🔒</div>
          <h1 className="font-display font-extrabold text-lg text-warm-900">
            앱 등록은 로그인 후 이용할 수 있어요
          </h1>
          <p className="text-xs text-warm-500">
            타이니앱을 등록하고 미리보기를 확인하려면 먼저 로그인해 주세요.
          </p>
          <div className="pt-2">
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-arcade-coral hover:bg-arcade-coralHover text-white text-xs font-bold shadow-btn-play transition-all"
            >
              로그인
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (registeredApp) {
    const shortSha = registeredApp.commitSha ? registeredApp.commitSha.slice(0, 7) : '-'

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

        <div className="bg-white border border-warm-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-warm-card">
          <div className="flex items-start justify-between gap-4 border-b border-warm-200 pb-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                ⏳ 승인 대기
              </div>
              <h1 className="font-display font-extrabold text-xl text-warm-900 pt-1">
                등록 완료! 관리자 승인 후 앱 목록에 공개됩니다
              </h1>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-warm-50 border border-warm-200 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-warm-500">앱 제목</span>
              <span className="font-extrabold text-warm-900">{registeredApp.title}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-warm-500">고정된 커밋</span>
              <code className="px-2 py-0.5 rounded bg-warm-200/70 font-mono font-bold text-warm-800">
                {shortSha}
              </code>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-warm-500">상태</span>
              <span className="font-bold text-amber-700">승인 대기 (PENDING)</span>
            </div>
          </div>

          {thumbnailPreviewUrl && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-warm-700">선택한 썸네일 미리보기</span>
                <span className="text-[11px] text-emerald-600 font-bold">등록 시 함께 저장됩니다</span>
              </div>
              <div className="p-3 rounded-2xl bg-warm-50 border border-warm-200 inline-block">
                <img
                  src={thumbnailPreviewUrl}
                  alt="등록 앱 썸네일 미리보기"
                  className="w-48 h-32 object-cover rounded-xl border border-warm-200 bg-white"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <div>
              <a
                href={registeredApp.playUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-warm-100 hover:bg-warm-200 border border-warm-200 text-xs text-warm-700 font-bold transition-colors"
              >
                미리보기 열기 ↗
              </a>
            </div>
            <p className="text-[11px] text-warm-500">
              새 탭에서 열려요 · 미리보기에서는 점수가 기록되지 않아요
            </p>
          </div>

          <div className="flex justify-end gap-2.5 pt-2 border-t border-warm-200">
            <button
              type="button"
              onClick={handleReset}
              className="px-5 py-2.5 rounded-xl bg-arcade-coral hover:bg-arcade-coralHover text-white text-xs font-bold shadow-btn-play transition-all"
            >
              다른 앱 등록하기
            </button>
          </div>
        </div>
      </div>
    )
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
        noValidate
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
                GitHub 공개 레포 주소로 웹 게임을 등록하고 미리보기를 확인해 보세요.
              </p>
            </div>
          </div>
        </div>

        {/* 등록 전 안내 박스 */}
        <div className="p-4 rounded-2xl bg-warm-100 border border-warm-200 text-xs text-warm-700 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-warm-900">📌 등록 전 확인해 주세요</span>
            <Link
              to="/guide"
              className="text-arcade-coral hover:underline font-bold text-[11px]"
            >
              자세히 보기 →
            </Link>
          </div>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-warm-600">
            <li>
              게임 레포는 <strong className="text-warm-800">공개(Public)</strong>여야 합니다.
            </li>
            <li>
              <strong className="text-warm-800">빌드 결과물을 레포에 커밋</strong>해야 합니다.
            </li>
            <li>
              Vite로 만들었다면{' '}
              <code className="px-1 py-0.5 rounded bg-warm-200 font-mono text-warm-800">
                base: &apos;./&apos;
              </code>
              로 빌드해야 합니다.
            </li>
            <li>
              등록하는 순간의 커밋으로 고정됩니다. 고친 버전은 새로 등록해야 반영됩니다.
            </li>
          </ul>
        </div>

        {serverError && (
          <div
            role="alert"
            className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs font-bold text-red-700"
          >
            ⚠️ {serverError}
          </div>
        )}

        <div className="space-y-4 text-xs">
          {/* 앱 제목 */}
          <div>
            <label htmlFor="app-title" className="block font-bold text-warm-700 mb-1.5">
              앱 제목 <span className="text-arcade-coral">*</span>
            </label>
            <input
              id="app-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 알고리즘 던전 탈출기 (1~100자)"
              className="w-full bg-warm-50 border border-warm-200 rounded-xl p-3 text-xs text-warm-800 focus:outline-none focus:bg-white focus:border-arcade-coral"
            />
            {fieldErrors.title && (
              <p className="mt-1 text-xs font-bold text-red-600">{fieldErrors.title}</p>
            )}
          </div>

          {/* 설명 */}
          <div>
            <label htmlFor="app-description" className="block font-bold text-warm-700 mb-1.5">
              설명 <span className="text-arcade-coral">*</span>
            </label>
            <textarea
              id="app-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="게임 소개와 조작 방법, 하이스코어 팁을 적어주세요 (1~500자)."
              className="w-full bg-warm-50 border border-warm-200 rounded-xl p-3 text-xs text-warm-800 resize-none focus:outline-none focus:bg-white focus:border-arcade-coral"
            />
            {fieldErrors.description && (
              <p className="mt-1 text-xs font-bold text-red-600">{fieldErrors.description}</p>
            )}
          </div>

          {/* GitHub 레포 주소 */}
          <div>
            <label htmlFor="app-repo-url" className="block font-bold text-warm-700 mb-1.5">
              GitHub 레포 주소 <span className="text-arcade-coral">*</span>
            </label>
            <input
              id="app-repo-url"
              type="url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/owner/repo"
              className="w-full bg-warm-50 border border-warm-200 rounded-xl p-3 text-xs font-mono text-warm-800 focus:outline-none focus:bg-white focus:border-arcade-coral"
            />
            <p className="mt-1 text-[11px] text-warm-500">공개(Public) 레포만 등록할 수 있어요</p>
            {fieldErrors.repoUrl && (
              <p className="mt-1 text-xs font-bold text-red-600">{fieldErrors.repoUrl}</p>
            )}
          </div>

          {/* 진입 HTML 경로 */}
          <div>
            <label htmlFor="app-entry-path" className="block font-bold text-warm-700 mb-1.5">
              진입 HTML 경로 (선택)
            </label>
            <input
              id="app-entry-path"
              type="text"
              value={entryPath}
              onChange={(e) => setEntryPath(e.target.value)}
              placeholder="dist/index.html"
              className="w-full bg-warm-50 border border-warm-200 rounded-xl p-3 text-xs font-mono text-warm-800 focus:outline-none focus:bg-white focus:border-arcade-coral"
            />
            <p className="mt-1 text-[11px] text-warm-500">
              빌드 도구(Vite 등)를 쓴 게임은 빌드된 시작 HTML 경로를 적어 주세요. 예:{' '}
              <code className="font-mono">dist/index.html</code>(빌드한 게임),{' '}
              <code className="font-mono">index.html</code>(빌드 없이 만든 게임)
            </p>
            {fieldErrors.entryPath && (
              <p className="mt-1 text-xs font-bold text-red-600">{fieldErrors.entryPath}</p>
            )}
          </div>

          {/* 최고 점수 */}
          <div>
            <label htmlFor="app-max-score" className="block font-bold text-warm-700 mb-1.5">
              최고 점수 (선택)
            </label>
            <input
              id="app-max-score"
              type="text"
              inputMode="decimal"
              value={maxScore}
              onChange={(e) => setMaxScore(e.target.value)}
              placeholder="비우면 보내지 않음 (0 이상, 소수 둘째 자리까지)"
              className="w-full bg-warm-50 border border-warm-200 rounded-xl p-3 text-xs font-mono text-warm-800 focus:outline-none focus:bg-white focus:border-arcade-coral"
            />
            <p className="mt-1 text-[11px] text-warm-500">
              게임에서 나올 수 있는 최고 점수. 이보다 높은 점수는 검증 대상이 됩니다
            </p>
            {fieldErrors.maxScore && (
              <p className="mt-1 text-xs font-bold text-red-600">{fieldErrors.maxScore}</p>
            )}
          </div>

          {/* 썸네일 칸 */}
          <ThumbnailField
            previewUrl={thumbnailPreviewUrl}
            fileName={thumbnailFileName}
            onSelect={handleThumbnailSelect}
          />
        </div>

        {isSubmitting && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800 text-center">
            등록 중… (GitHub 확인에 몇 초 걸릴 수 있어요)
          </div>
        )}

        <div className="flex justify-end gap-2.5 pt-2">
          <Link
            to="/apps"
            className="px-4 py-2.5 rounded-xl bg-warm-100 hover:bg-warm-200 text-xs text-warm-700 font-bold transition-colors"
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-arcade-coral hover:bg-arcade-coralHover disabled:opacity-60 text-white text-xs font-bold shadow-btn-play transition-all"
          >
            {isSubmitting ? '등록 중…' : '등록하기'}
          </button>
        </div>
      </form>
    </div>
  )
}
