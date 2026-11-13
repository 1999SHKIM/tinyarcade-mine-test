import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getApps, type AppResponse } from '../../api/apps'
import { AppThumbnail } from '../../features/apps/AppThumbnail'

type AppFilterType = 'all' | 'official' | 'user'
type SortType = 'RECOMMEND' | 'LATEST' | 'PLAY_COUNT'

export function AppListPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialFilter = (searchParams.get('filter') as AppFilterType) || 'all'

  const [apps, setApps] = useState<AppResponse[]>([])
  const [filter, setFilter] = useState<AppFilterType>(
    initialFilter === 'official' || initialFilter === 'user' ? initialFilter : 'all',
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortType>('RECOMMEND')

  useEffect(() => {
    getApps().then(setApps).catch(() => setApps([]))
  }, [])

  const totalCount = apps.length
  const officialCount = apps.filter((app) => app.isOfficial).length
  const userCount = apps.filter((app) => !app.isOfficial).length

  const filteredApps = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()

    return apps.filter((app) => {
      if (filter === 'official' && !app.isOfficial) return false
      if (filter === 'user' && app.isOfficial) return false

      if (q) {
        const hay = `${app.title} ${app.description} ${app.categoryTag ?? ''} ${app.creatorNickname ?? app.creatorHandle ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    }).sort((a, b) => {
      if (sortBy === 'RECOMMEND') return b.recommendCount - a.recommendCount
      if (sortBy === 'PLAY_COUNT') return b.playCount - a.playCount
      return b.createdAt.localeCompare(a.createdAt)
    })
  }, [apps, filter, searchQuery, sortBy])

  const handleFilterChange = (nextFilter: AppFilterType) => {
    setFilter(nextFilter)
    if (nextFilter === 'all') {
      setSearchParams({})
    } else {
      setSearchParams({ filter: nextFilter })
    }
  }

  return (
    <div className="space-y-5">
      {/* App List Header Bar */}
      <section className="bg-white border border-warm-200 rounded-3xl p-5 sm:p-6 shadow-warm-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🕹️</span>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-warm-900 tracking-tight">
              타이니앱 탐색
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-warm-500 mt-1">
            공식 코딩학습 아케이드부터 유저 창작 게임까지 16:10 웹으로 바로 플레이하세요.
          </p>
        </div>

        <Link
          to="/apps/register"
          className="px-5 py-3 rounded-2xl bg-arcade-coral hover:bg-arcade-coralHover text-white font-display font-bold text-sm shadow-btn-play transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span>타이니앱 등록하기</span>
        </Link>
      </section>

      {/* Filters & Search Toolbar */}
      <section className="bg-white border border-warm-200 rounded-2xl p-3 sm:p-4 shadow-warm-card flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Filter Tabs: ALL / OFFICIAL / USER */}
        <div className="flex rounded-xl bg-warm-100 p-1 border border-warm-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => handleFilterChange('all')}
            className={`px-4 py-2 rounded-lg transition-all ${
              filter === 'all'
                ? 'bg-white text-warm-900 shadow-sm'
                : 'text-warm-500 hover:text-warm-800'
            }`}
          >
            전체 보기 ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => handleFilterChange('official')}
            className={`px-4 py-2 rounded-lg transition-all ${
              filter === 'official'
                ? 'bg-white text-warm-900 shadow-sm'
                : 'text-warm-500 hover:text-warm-800'
            }`}
          >
            🎓 공식 학습 앱 ({officialCount})
          </button>
          <button
            type="button"
            onClick={() => handleFilterChange('user')}
            className={`px-4 py-2 rounded-lg transition-all ${
              filter === 'user'
                ? 'bg-white text-warm-900 shadow-sm'
                : 'text-warm-500 hover:text-warm-800'
            }`}
          >
            ✨ 유저 창작 앱 ({userCount})
          </button>
        </div>

        {/* Search Bar & Sort Dropdown */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="앱 이름, 프로그래밍 언어, 태그 검색..."
              className="w-full bg-warm-50 border border-warm-200 rounded-xl pl-9 pr-3 py-2 text-xs text-warm-800 placeholder-warm-400 focus:outline-none focus:bg-white focus:border-arcade-coral transition-all"
            />
            <svg
              className="w-4 h-4 text-warm-400 absolute left-3 top-2.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortType)}
            className="bg-warm-50 border border-warm-200 rounded-xl px-3 py-2 text-xs font-bold text-warm-700 focus:outline-none focus:border-arcade-coral"
          >
            <option value="RECOMMEND">추천순</option>
            <option value="LATEST">최신순</option>
            <option value="PLAY_COUNT">플레이 횟수순</option>
          </select>
        </div>
      </section>

      {/* App Cards Grid */}
      {filteredApps.length === 0 ? (
        <div className="bg-white border border-warm-200 rounded-3xl p-12 text-center space-y-2 shadow-warm-card">
          <div className="text-3xl">🔍</div>
          <div className="font-display font-bold text-base text-warm-800">
            검색 조건에 맞는 타이니앱이 없습니다.
          </div>
          <p className="text-xs text-warm-500">다른 키워드나 필터를 선택해 보세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredApps.map((app) => (
            <div
              key={app.id}
              onClick={() => navigate(`/apps/${app.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  navigate(`/apps/${app.id}`)
                }
              }}
              className="bg-white border border-warm-200 rounded-3xl overflow-hidden shadow-warm-card hover:shadow-warm-hover transition-all group flex flex-col cursor-pointer"
            >
              <div className="aspect-[16/10] bg-warm-100 relative overflow-hidden border-b border-warm-200">
                <AppThumbnail
                  url={app.thumbnailUrl}
                  title={app.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 flex gap-1.5">
                  {app.isOfficial ? (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/95 text-emerald-700 shadow-sm border border-emerald-100 backdrop-blur-sm">
                      ● OFFICIAL
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/95 text-warm-700 shadow-sm border border-warm-200 backdrop-blur-sm">
                      USER
                    </span>
                  )}
                </div>
                {app.categoryTag && (
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-mono bg-warm-900/80 text-white backdrop-blur-sm">
                    {app.categoryTag}
                  </span>
                )}
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-warm-400 font-mono mb-1">
                    <span>by {app.creatorNickname || app.creatorHandle}</span>
                    <span>{app.createdAt}</span>
                  </div>
                  <h3 className="font-display font-bold text-base text-warm-900 group-hover:text-arcade-coral transition-colors line-clamp-1">
                    {app.title}
                  </h3>
                  <p className="text-xs text-warm-600 line-clamp-2 mt-1 leading-relaxed">
                    {app.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-warm-100 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-warm-500">
                    <span>👍 추천 {app.recommendCount}</span>
                    <span>🎮 {app.playCount.toLocaleString()}회</span>
                    {app.weeklyTopScore != null && (
                      <span className="font-bold text-arcade-coral">
                        주간 1위: {app.weeklyTopScore.toLocaleString()}점
                      </span>
                    )}
                  </div>
                  <span className="block w-full py-2 rounded-xl bg-warm-100 group-hover:bg-arcade-coral group-hover:text-white text-warm-700 font-bold text-xs text-center transition-all">
                    상세 정보 & 플레이 →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
