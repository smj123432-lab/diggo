'use client'

// 일감 목록 — 사이드바 필터 + 2열 그리드 + 무한스크롤
import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '@/store/auth'
import { useJobs, DEFAULT_FILTERS } from '@/hooks/useJobs'
import type { JobFilters } from '@/hooks/useJobs'
import type { JobWithManager } from '@/types'
import { JobCard } from './JobCard'
import { JobFilters as JobFiltersPanel } from './JobFilters'

export function JobList() {
  const { profile } = useAuthStore()
  const [filters, setFilters] = useState<JobFilters>(DEFAULT_FILTERS)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } = useJobs(filters)

  const jobs = data?.pages.flatMap((page) => page.data) ?? []
  const totalCount = data?.pages[0]?.count ?? 0

  // 스크롤 끝 감지 → 다음 페이지 자동 로드
  useEffect(() => {
    const el = loadMoreRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const isPreferred = (job: JobWithManager): boolean => {
    if (!profile || profile.role !== 'driver') return false
    const equipMatch = profile.preferred_equipment_codes?.includes(job.equipment_code) ?? false
    const typeMatch = profile.preferred_job_types?.includes(job.job_type) ?? false
    return equipMatch || typeMatch
  }

  return (
    <div className="flex gap-6">
      {/* 사이드바 필터 */}
      <JobFiltersPanel filters={filters} onChange={setFilters} />

      {/* 메인 콘텐츠 */}
      <div className="flex-1 min-w-0">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          {isLoading ? (
            <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
          ) : (
            <p className="text-sm text-gray-500">
              일감 <span className="text-gray-900 font-bold">{totalCount.toLocaleString()}</span>개
            </p>
          )}
        </div>

        {/* 로딩 스켈레톤 */}
        {isLoading && (
          <div className="grid grid-cols-2 gap-4">
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

        {/* 2열 그리드 */}
        {jobs.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
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
  )
}
