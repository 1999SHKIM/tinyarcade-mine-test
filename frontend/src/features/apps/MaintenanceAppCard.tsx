import type { TinyApp } from '../../types'

// [참고] 정비중 게임 카드: 서버에 없는 예전 시안 게임(maintenanceApps.ts)을 홈 목록에 "곧 나올 게임"으로 보여 준다
// - 홈에만 보인다. 눌러도 아무 데도 가지 않는다(서버에 없는 앱이라 상세 화면이 없음).
// - 플레이 버튼은 회색 비활성화. 추천·플레이 수는 가짜라 보여 주지 않는다.
// - 홈 위쪽 숫자(F2), 랭킹·리더보드에는 들어가지 않는다(실제 앱 목록과 따로 그린다).

export function MaintenanceAppCard({ app }: { app: TinyApp }) {
  return (
    <div
      aria-disabled="true"
      className="bg-white border border-warm-200 rounded-2xl overflow-hidden shadow-warm-card flex flex-col cursor-not-allowed"
    >
      <div className="aspect-[16/10] bg-warm-100 relative overflow-hidden border-b border-warm-200">
        <img
          src={app.bannerUrl}
          alt={app.title}
          className="w-full h-full object-cover grayscale opacity-60"
        />
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/95 text-warm-600 shadow-sm border border-warm-200">
          🔧 정비중
        </span>
      </div>
      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
        <div>
          <h3 className="font-display font-bold text-xs sm:text-sm text-warm-500 line-clamp-1">
            {app.title}
          </h3>
          <p className="text-[11px] text-warm-400 line-clamp-2 mt-1 leading-relaxed">
            {app.description}
          </p>
        </div>
        <div className="pt-2 border-t border-warm-100 flex justify-end text-[11px]">
          <button
            type="button"
            disabled
            className="px-2.5 py-1 rounded-lg bg-warm-100 font-bold text-warm-400 cursor-not-allowed"
          >
            정비중
          </button>
        </div>
      </div>
    </div>
  )
}
