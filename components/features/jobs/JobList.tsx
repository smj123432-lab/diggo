'use client'

// 일감 목록 — 모바일: 칩 필터 + 1열 / 데스크톱: 사이드바 + 2열 그리드
import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import { useJobs, DEFAULT_FILTERS } from '@/hooks/useJobs'
import type { JobFilters } from '@/hooks/useJobs'
import type { EquipmentCode, JobType, JobWithManager } from '@/types'
import { EQUIPMENT_LABELS, EQUIPMENT_CODES_LIST, JOB_TYPE_LABELS, JOB_TYPES_LIST } from '@/types'
import { JobCard } from './JobCard'
import { JobFilters as JobFiltersPanel } from './JobFilters'

export function JobList() {
  const { profile, role } = useAuthStore()
  const [filters, setFilters] = useState<JobFilters>(DEFAULT_FILTERS)
  const [searchInput, setSearchInput] = useState('')
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const handleSearch = () => {
    const keyword = searchInput.trim() || undefined
    setFilters((f) => ({ ...f, keyword }))
  }

  const handleClearSearch = () => {
    setSearchInput('')
    setFilters((f) => ({ ...f, keyword: undefined }))
  }

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } = useJobs(filters)

  const rawJobs = data?.pages.flatMap((page) => page.data) ?? []
  const totalCount = data?.pages[0]?.count ?? 0

  // 기사 선호 기반 상위 정렬 — 선호 일감 먼저, 그 안에서 최신순
  const jobs = useMemo(() => {
    if (!profile || profile.role !== 'driver') return rawJobs

    const preferred = (job: (typeof rawJobs)[0]) =>
      profile.preferred_job_types?.includes(job.job_type) ||
      profile.preferred_equipment_codes?.includes(job.equipment_code)

    return [...rawJobs].sort((a, b) => {
      const aP = preferred(a)
      const bP = preferred(b)
      if (aP && !bP) return -1
      if (!aP && bP) return 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [rawJobs, profile])

  useEffect(() => {
    const el = loadMoreRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage()
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const isPreferred = (job: JobWithManager): boolean => {
    if (!profile || profile.role !== 'driver') return false
    return (
      (profile.preferred_equipment_codes?.includes(job.equipment_code) ?? false) ||
      (profile.preferred_job_types?.includes(job.job_type) ?? false)
    )
  }

  const toggleEquipment = (code: EquipmentCode) =>
    setFilters((f) => ({
      ...f,
      equipment_codes: f.equipment_codes.includes(code)
        ? f.equipment_codes.filter((c) => c !== code)
        : [...f.equipment_codes, code],
    }))

  const toggleJobType = (type: JobType) =>
    setFilters((f) => ({
      ...f,
      job_types: f.job_types.includes(type)
        ? f.job_types.filter((t) => t !== type)
        : [...f.job_types, type],
    }))

  const hasActiveFilters = filters.equipment_codes.length > 0 || filters.job_types.length > 0

  return (
    <div>
      {/* ── 모바일 전용 칩 필터 ── */}
      <div className="md:hidden mb-4">
        <div className="overflow-x-auto no-scrollbar">
          <div className="flex gap-2 pb-1 w-max">
            {hasActiveFilters && (
              <button
                onClick={() => setFilters(DEFAULT_FILTERS)}
                className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-200 text-gray-600 hover:bg-gray-300 transition-all"
              >
                초기화
              </button>
            )}
            {EQUIPMENT_CODES_LIST.map((code) => (
              <button
                key={code}
                onClick={() => toggleEquipment(code)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  filters.equipment_codes.includes(code)
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
                }`}
              >
                {EQUIPMENT_LABELS[code]}
              </button>
            ))}
            <div className="w-px bg-gray-200 mx-1 self-stretch shrink-0" />
            {JOB_TYPES_LIST.map((type) => (
              <button
                key={type}
                onClick={() => toggleJobType(type)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  filters.job_types.includes(type)
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
                }`}
              >
                {JOB_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── 데스크톱: 사이드바 + 그리드 / 모바일: 그리드만 ── */}
      <div className="flex gap-6">
        {/* 사이드바 — 데스크톱만 */}
        <div className="hidden md:block">
          <JobFiltersPanel filters={filters} onChange={setFilters} />
        </div>

        {/* 메인 콘텐츠 */}
        <div className="flex-1 min-w-0">
          {/* 검색 바 */}
          <div className="relative mb-5">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="지역 또는 현장 주소를 검색해 보세요 (예: 성수동, 수원)"
              className="w-full pl-4 pr-24 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shadow-sm"
            />
            {/* 초기화 버튼 — 검색어 있을 때만 */}
            {searchInput && (
              <button
                onClick={handleClearSearch}
                className="absolute right-14 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
            {/* 검색 버튼 */}
            <button
              onClick={handleSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              검색
            </button>
          </div>

          {/* 헤더: 일감 수 + 소장 일감 올리기 버튼 */}
          <div className="flex items-center justify-between mb-4">
            {isLoading ? (
              <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
            ) : (
              <p className="text-sm text-gray-500">
                일감 <span className="text-gray-900 font-bold">{totalCount.toLocaleString()}</span>개
              </p>
            )}
            {role === 'manager' && (
              <Link
                href="/jobs/new"
                className="inline-flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                일감 올리기
              </Link>
            )}
          </div>

          {/* 로딩 스켈레톤 */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-2xl h-44 animate-pulse" />
              ))}
            </div>
          )}

          {/* 에러 */}
          {isError && (
            <div className="text-center py-20">
              <p className="text-gray-500">일감을 불러오지 못했습니다.</p>
              <p className="text-gray-400 text-sm mt-1">잠시 후 다시 시도해주세요.</p>
            </div>
          )}

          {/* 빈 목록 */}
          {!isLoading && !isError && jobs.length === 0 && (
            <div className="text-center py-20">
              {filters.keyword ? (
                <>
                  <p className="text-2xl mb-3">🔍</p>
                  <p className="text-gray-700 font-medium mb-1">
                    앗, 현재 해당 지역에는 등록된 일감이 없습니다!
                  </p>
                  <p className="text-gray-400 text-sm">다른 지역을 검색해 보세요.</p>
                  <button
                    onClick={handleClearSearch}
                    className="mt-4 text-blue-500 text-sm hover:underline"
                  >
                    전체 목록 보기
                  </button>
                </>
              ) : (
                <>
                  <p className="text-gray-700 font-medium mb-2">등록된 일감이 없습니다</p>
                  <p className="text-gray-400 text-sm">필터를 변경하거나 나중에 다시 확인해보세요.</p>
                </>
              )}
            </div>
          )}

          {/* 카드 그리드 — 모바일 1열 / sm 이상 2열 */}
          {jobs.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} isPreferred={isPreferred(job)} />
              ))}
            </div>
          )}

          {/* 무한스크롤 트리거 */}
          <div ref={loadMoreRef} className="py-8 flex justify-center">
            {isFetchingNextPage && (
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                불러오는 중...
              </div>
            )}
            {!hasNextPage && jobs.length > 0 && (
              <p className="text-gray-300 text-sm">모든 일감을 확인했습니다</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
