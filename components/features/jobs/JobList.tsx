'use client'

// 일감 목록 — 모바일: 칩 필터 + 1열 / 데스크톱: 사이드바 + 2열 그리드
import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import { useJobs, DEFAULT_FILTERS } from '@/hooks/useJobs'
import type { JobFilters, SortBy } from '@/hooks/useJobs'
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

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isFetching, isError } = useJobs(filters)

  // 필터/정렬 변경 시 리패치 중 (기존 데이터 있는 상태)
  const isRefetching = isFetching && !isLoading && !isFetchingNextPage

  const rawJobs = data?.pages.flatMap((page) => page.data) ?? []
  const totalCount = data?.pages[0]?.count ?? 0

  // 정렬 처리 — 모든 모드에서 모집중이 마감보다 항상 상단
  const jobs = useMemo(() => {
    const isOpen = (job: (typeof rawJobs)[0]) => job.status === 'open'

    if (filters.sortBy === 'deadline') {
      return [...rawJobs].sort((a, b) => {
        if (isOpen(a) && !isOpen(b)) return -1
        if (!isOpen(a) && isOpen(b)) return 1
        // 같은 상태 내에서 마감 임박순 (서버가 work_date ASC 정렬 → 상대 순서 유지)
        return new Date(a.work_date).getTime() - new Date(b.work_date).getTime()
      })
    }

    if (filters.sortBy === 'preferred' && profile?.role === 'driver') {
      const isPreferredJob = (job: (typeof rawJobs)[0]) =>
        profile.preferred_job_types?.includes(job.job_type) ||
        job.equipment_codes.some(c => profile.preferred_equipment_codes?.includes(c))

      return [...rawJobs].sort((a, b) => {
        // 1순위: 모집중 > 마감
        if (isOpen(a) && !isOpen(b)) return -1
        if (!isOpen(a) && isOpen(b)) return 1
        // 2순위: 선호 > 비선호
        const aP = isPreferredJob(a)
        const bP = isPreferredJob(b)
        if (aP && !bP) return -1
        if (!aP && bP) return 1
        // 3순위: 마감 임박순
        return new Date(a.work_date).getTime() - new Date(b.work_date).getTime()
      })
    }

    // latest (기본) — 모집중 먼저, 각 그룹 내 최신순
    return [...rawJobs].sort((a, b) => {
      if (isOpen(a) && !isOpen(b)) return -1
      if (!isOpen(a) && isOpen(b)) return 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [rawJobs, profile, filters.sortBy])

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
      (job.equipment_codes.some(c => profile.preferred_equipment_codes?.includes(c)) ?? false) ||
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
      <div className="md:hidden mb-4 -mx-6">
        <div className="overflow-x-auto no-scrollbar">
          <div className="flex gap-2 pb-1 w-max pl-6 pr-12">
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
                    ? 'bg-brand-blue border-brand-blue text-white'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-brand-blue-light'
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
                    ? 'bg-brand-blue border-brand-blue text-white'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-brand-blue-light'
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
        {/* 사이드바 — 데스크톱만, 헤더(h-16) 아래 sticky */}
        <div className="hidden md:block sticky top-20 self-start max-h-[calc(100vh-5rem)] overflow-y-auto">
          <JobFiltersPanel filters={filters} onChange={setFilters} />
        </div>

        {/* 메인 콘텐츠 */}
        <div className="flex-1 min-w-0">
          {/* 검색 바 */}
          <div className="flex items-center gap-2 mb-5">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="지역 또는 현장 주소 검색 (예: 성수동, 수원)"
                className="w-full pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition shadow-sm"
              />
              {/* 모바일: 돋보기 아이콘(검색) 또는 X(초기화) — 인풋 내부 오른쪽 */}
              <button
                onClick={searchInput ? handleClearSearch : handleSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {searchInput ? (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 md:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                )}
              </button>
            </div>
            {/* 검색 버튼 — 데스크톱만 */}
            <button
              onClick={handleSearch}
              className="hidden md:flex shrink-0 items-center gap-1.5 bg-brand-blue hover:bg-brand-blue-dark text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              검색
            </button>
          </div>

          {/* 일감 수 + 정렬 드롭다운 행 */}
          <div className="flex items-center justify-between mb-6">
            {isLoading ? (
              <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
            ) : (
              <p className="text-sm text-gray-500">
                일감 <span className="text-gray-900 font-bold">{totalCount.toLocaleString()}</span>개
              </p>
            )}
            <div className="flex items-center gap-2">
              {/* 정렬 드롭다운 */}
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters((f) => ({ ...f, sortBy: e.target.value as SortBy }))}
                className="text-sm text-gray-600 border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent cursor-pointer shadow-sm"
              >
                <option value="deadline">마감 임박순</option>
                {role !== 'manager' && <option value="preferred">내 선호</option>}
              </select>
              {role === 'manager' && (
                <Link
                  href="/jobs/new"
                  className="hidden md:inline-flex items-center gap-1.5 bg-brand-blue hover:bg-brand-blue-dark text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  일감 올리기
                </Link>
              )}
            </div>
          </div>

          {/* 로딩 스켈레톤 — 초기 로딩 또는 필터/정렬 변경 시 */}
          {(isLoading || isRefetching) && (
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
          {!isLoading && !isRefetching && !isError && jobs.length === 0 && (
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
                    className="mt-4 text-brand-blue text-sm hover:underline"
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
          {!isRefetching && jobs.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  isPreferred={isPreferred(job)}
                />
              ))}
            </div>
          )}

          {/* 무한스크롤 트리거 */}
          <div ref={loadMoreRef} className="py-8 flex justify-center">
            {isFetchingNextPage && (
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-brand-blue rounded-full animate-spin" />
                불러오는 중...
              </div>
            )}
            {!hasNextPage && jobs.length > 0 && (
              <p className="text-gray-300 text-sm">모든 일감을 확인했습니다</p>
            )}
          </div>
        </div>
      </div>

      {/* ── 모바일 FAB — 소장 전용 ── */}
      {role === 'manager' && (
        <Link
          href="/jobs/new"
          className="md:hidden fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-brand-blue hover:bg-brand-blue-dark text-white rounded-full shadow-xl shadow-blue-500/30 active:scale-95 transition-all"
          aria-label="일감 등록"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </Link>
      )}
    </div>
  )
}
