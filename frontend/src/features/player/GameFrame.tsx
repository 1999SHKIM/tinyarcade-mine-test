interface GameFrameProps {
  src?: string
  title?: string
}

// [김 담당] 격리된 sandbox iframe 실행 영역
export function GameFrame({ src, title = 'TinyApp' }: GameFrameProps) {
  return (
    <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-slate-300 bg-slate-900 text-sm text-slate-300">
      {src ? (
        <iframe
          src={src}
          title={title}
          sandbox="allow-scripts"
          className="h-full w-full rounded-lg"
        />
      ) : (
        <span>게임 실행 iframe 영역 (GameFrame - 김 담당)</span>
      )}
    </div>
  )
}
