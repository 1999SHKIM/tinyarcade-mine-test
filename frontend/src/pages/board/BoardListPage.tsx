import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Tabs } from '../../components'
import type { BoardType } from '../../types'

export function BoardListPage() {
  const [boardType, setBoardType] = useState<BoardType>('FREE')

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">게시판 목록 (BoardListPage)</h1>
        <Link
          to="/board/write"
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          글쓰기
        </Link>
      </div>
      <Tabs
        tabs={[
          { key: 'FREE', label: '자유게시판' },
          { key: 'INQUIRY', label: '문의게시판' },
          { key: 'FAQ', label: 'FAQ' },
        ]}
        activeKey={boardType}
        onChange={setBoardType}
      />
      <p className="text-sm text-slate-600">
        현재 선택 탭: <strong>{boardType}</strong> |{' '}
        <Link to="/board/1" className="text-indigo-600 underline">
          샘플 게시글 상세(#1) 보기
        </Link>
      </p>
    </div>
  )
}
