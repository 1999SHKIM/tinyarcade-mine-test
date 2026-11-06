import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getErrorMessage } from '../../api/client'
import { useAuth } from '../../features/auth/useAuth'

// [김 담당] 로그인 페이지 (03_10_tinyarcade_auth §4-2). 디자인은 18번에서 허가 다듬는다
export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const justSignedUp = (location.state as { signedUp?: boolean } | null)?.signedUp === true

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(getErrorMessage(err, '로그인에 실패했습니다.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-4 rounded-lg border border-slate-200 bg-white p-6">
      <h1 className="text-2xl font-bold">로그인</h1>
      {justSignedUp && (
        <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">
          회원가입이 완료되었습니다. 로그인해 주세요.
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block space-y-1">
          <span className="text-sm font-medium">이메일</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">비밀번호</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? '로그인 중...' : '로그인'}
        </button>
      </form>
      <p className="text-center text-sm text-slate-600">
        계정이 없나요?{' '}
        <Link to="/signup" className="font-medium text-indigo-600 hover:underline">
          회원가입
        </Link>
      </p>
    </div>
  )
}
