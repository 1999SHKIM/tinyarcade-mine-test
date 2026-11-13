// [참고] 앱 썸네일: 있으면 그림, 없으면 사이트 로고와 같은 그라데이션 + 🎮
// - 썸네일은 등록 때 선택이라 없는 앱이 있다. 서버는 bannerUrl을 주지 않으므로 thumbnailUrl만 본다.
// - small: 홈 유저 앱 목록처럼 작은 칸에서 🎮를 작게.
export function AppThumbnail({ url, title, className, small = false }: {
  url: string | null
  title: string
  className?: string
  small?: boolean
}) {
  if (url) return <img src={url} alt={title} className={className} />
  return (
    <div
      role="img"
      aria-label={title}
      className="w-full h-full bg-gradient-to-tr from-arcade-coral to-amber-400 flex items-center justify-center"
    >
      <span className={small ? 'text-2xl' : 'text-6xl'}>🎮</span>
    </div>
  )
}
