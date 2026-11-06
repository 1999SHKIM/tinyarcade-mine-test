import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getErrorMessage } from '../../api/client'
import { useAuth } from '../../features/auth/useAuth'

// [김 담당] 로그인 페이지 (03_10_tinyarcade_auth §4-2). 디자인은 18번에서 허가 다듬는다
//
// [공부 포인트]
// - "제어 컴포넌트": 입력칸의 값(value)을 React 상태(useState)로 들고, 입력할 때마다 onChange로 상태를 바꾼다.
// - 폼 제출(onSubmit): e.preventDefault()로 브라우저 기본 동작(페이지 새로고침)을 막고 직접 API를 호출한다.
// - useNavigate: 코드로 다른 화면으로 이동한다(성공 시 홈으로).
// - useLocation().state: 회원가입 화면이 navigate('/login', { state: { signedUp: true } })로 넘긴 값을 받는다.
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
      await login(email, password) // AuthContext의 login: 토큰 저장 + user 설정
      navigate('/')
    } catch (err) {
      setError(getErrorMessage(err, '로그인에 실패했습니다.')) // 서버의 message를 그대로 보여 준다
    } finally {
      setSubmitting(false) // finally: 성공·실패 상관없이 버튼을 다시 누를 수 있게
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
