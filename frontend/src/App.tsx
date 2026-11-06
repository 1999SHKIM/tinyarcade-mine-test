import { useEffect, useState } from 'react'
import api from './api/client'

function App() {
  const [status, setStatus] = useState('확인 중...')

  useEffect(() => {
    api.get<string>('/health')
      .then((res) => setStatus(res.data))
      .catch(() => setStatus('backend 연결 실패'))
  }, [])

  return <div>API 상태: {status}</div>
}

export default App
