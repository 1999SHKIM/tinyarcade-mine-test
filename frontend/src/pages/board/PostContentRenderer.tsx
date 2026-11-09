import type { ReactNode } from 'react'

// 인라인 서식(**굵게**, `인라인 코드`)을 안전하게 React 노드로 변환
function renderInlineTokens(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return parts.map((part, idx) => {
    const key = `${keyPrefix}-${idx}`
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={key} className="font-bold text-warm-900">
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={key}
          className="px-1.5 py-0.5 mx-0.5 rounded-md bg-warm-100 border border-warm-200 font-mono text-xs text-arcade-coral font-semibold"
        >
          {part.slice(1, -1)}
        </code>
      )
    }
    return part
  })
}

// 마크다운 스타일 본문(##, ###, ```code```, >, - 목록, ---)을 XSS 없이 React 엘리먼트로 렌더링
export function PostContentRenderer({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const blocks: ReactNode[] = []

  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    // 빈 줄 건너뛰기
    if (!trimmed) {
      i += 1
      continue
    }

    // 코드블록 (``` ... ```)
    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim() || 'code'
      const codeLines: string[] = []
      i += 1
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i])
        i += 1
      }
      if (i < lines.length) {
        i += 1
      }
      blocks.push(
        <div
          key={`code-${i}`}
          className="my-4 rounded-2xl bg-warm-900 text-warm-100 border border-warm-800 overflow-hidden shadow-sm"
        >
          <div className="flex items-center justify-between px-4 py-2 bg-warm-800/80 border-b border-warm-700/70 text-[11px] font-mono text-warm-400">
            <span className="uppercase tracking-wider font-semibold text-arcade-amber">
              {lang}
            </span>
            <span>TinyArcade Snippet</span>
          </div>
          <pre className="p-4 text-xs sm:text-sm font-mono leading-relaxed overflow-x-auto">
            <code>{codeLines.join('\n')}</code>
          </pre>
        </div>,
      )
      continue
    }

    // 구분선 (---)
    if (/^-{3,}$/.test(trimmed)) {
      blocks.push(<hr key={`hr-${i}`} className="my-5 border-warm-200" />)
      i += 1
      continue
    }

    // 소제목 H2 (## )
    if (trimmed.startsWith('## ')) {
      blocks.push(
        <h2
          key={`h2-${i}`}
          className="mt-6 mb-2.5 font-display font-extrabold text-base sm:text-lg text-warm-900 flex items-center gap-2"
        >
          <span className="w-1.5 h-4 rounded-full bg-arcade-coral inline-block shrink-0" />
          <span>{renderInlineTokens(trimmed.slice(3), `h2-${i}`)}</span>
        </h2>,
      )
      i += 1
      continue
    }

    // 소제목 H3 (### )
    if (trimmed.startsWith('### ')) {
      blocks.push(
        <h3
          key={`h3-${i}`}
          className="mt-5 mb-2 font-display font-bold text-sm sm:text-base text-warm-900"
        >
          {renderInlineTokens(trimmed.slice(4), `h3-${i}`)}
        </h3>,
      )
      i += 1
      continue
    }

    // 인용구 (> )
    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''))
        i += 1
      }
      blocks.push(
        <blockquote
          key={`quote-${i}`}
          className="my-4 pl-4 pr-4 py-3 rounded-r-2xl border-l-4 border-arcade-coral bg-warm-50 text-xs sm:text-sm text-warm-700 italic leading-relaxed"
        >
          {quoteLines.map((qLine, qIdx) => (
            <p key={`q-${i}-${qIdx}`}>
              {renderInlineTokens(qLine, `q-${i}-${qIdx}`)}
            </p>
          ))}
        </blockquote>,
      )
      continue
    }

    // 불릿 리스트 (- )
    if (trimmed.startsWith('- ')) {
      const listItems: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('- ')) {
        listItems.push(lines[i].trim().slice(2))
        i += 1
      }
      blocks.push(
        <ul
          key={`ul-${i}`}
          className="my-3 space-y-1.5 pl-4 text-xs sm:text-sm text-warm-700 list-disc marker:text-arcade-coral"
        >
          {listItems.map((item, lIdx) => (
            <li key={`li-${i}-${lIdx}`} className="leading-relaxed">
              {renderInlineTokens(item, `li-${i}-${lIdx}`)}
            </li>
          ))}
        </ul>,
      )
      continue
    }

    // 일반 문단
    blocks.push(
      <p
        key={`p-${i}`}
        className="my-2.5 text-sm sm:text-[15px] text-warm-800 leading-relaxed whitespace-pre-wrap"
      >
        {renderInlineTokens(line, `p-${i}`)}
      </p>,
    )
    i += 1
  }

  return <div className="space-y-1">{blocks}</div>
}
