import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signup } from '../../api/auth'
import { getErrorMessage } from '../../api/client'

// [김 담당] 회원가입 페이지 (만 14세 이상 확인 포함, 03_10_tinyarcade_auth §4-2). 디자인은 18번에서 허가 다듬는다
export function SignupPage() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [ageConfirmed, setAgeConfirmed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await signup({ email, password, nickname, ageConfirmed })
      navigate('/login', { state: { signedUp: true } })
    } catch (err) {
      setError(getErrorMessage(err, '회원가입에 실패했습니다.'))
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = 'w-full rounded-md border border-slate-300 px-3 py-2 text-sm'

  return (
    <div className="mx-auto max-w-md space-y-4 rounded-lg border border-slate-200 bg-white p-6">
      <h1 className="text-2xl font-bold">회원가입</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block space-y-1">
          <span className="text-sm font-medium">이메일</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            required maxLength={150} autoComplete="email" className={inputClass} />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">비밀번호 (8~64자)</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            required minLength={8} maxLength={64} autoComplete="new-password" className={inputClass} />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">닉네임 (2~20자)</span>
          <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)}
            required minLength={2} maxLength={20} className={inputClass} />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={ageConfirmed} onChange={(e) => setAgeConfirmed(e.target.checked)} />
          만 14세 이상입니다. (필수)
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? '가입 중...' : '회원가입'}
        </button>
      </form>
      <p className="text-center text-sm text-slate-600">
        이미 계정이 있나요?{' '}
        <Link to="/login" className="font-medium text-indigo-600 hover:underline">
          로그인
        </Link>
      </p>
    </div>
  )
}
