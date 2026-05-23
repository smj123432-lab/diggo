'use client'

// 일감 목록 — 모바일: 칩 필터 + 1열 / 데스크톱: 사이드바 + 2열 그리드
import { useState, useEffect, useRef } from 'react'
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
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } = useJobs(filters)

  const jobs = data?.pages.flatMap((page) => page.data) ?? []
  const totalCount = data?.pages[0]?.count ?? 0

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
              <p className="text-gray-700 font-medium mb-2">등록된 일감이 없습니다</p>
              <p className="text-gray-400 text-sm">필터를 변경하거나 나중에 다시 확인해보세요.</p>
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
