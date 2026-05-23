'use client'

// 일감 목록 — 필터 + 무한스크롤
import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '@/store/auth'
import { useJobs } from '@/hooks/useJobs'
import type { JobFilters } from '@/hooks/useJobs'
import type { EquipmentCode, JobType, JobWithManager } from '@/types'
import { JobCard } from './JobCard'
import { JobFilters as JobFiltersUI } from './JobFilters'

export function JobList() {
  const { profile } = useAuthStore()
  const [filters, setFilters] = useState<JobFilters>({})
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

  // 로그인한 기사의 선호도와 일치 여부 확인
  const isPreferred = (job: JobWithManager): boolean => {
    if (!profile || profile.role !== 'driver') return false
    const equipMatch = profile.preferred_equipment_codes?.includes(job.equipment_code) ?? false
    const typeMatch = profile.preferred_job_types?.includes(job.job_type) ?? false
    return equipMatch || typeMatch
  }

  const handleEquipmentChange = (code: EquipmentCode | '') => {
    setFilters((f) => ({ ...f, equipment_code: code || undefined }))
  }

  const handleJobTypeChange = (type: JobType | '') => {
    setFilters((f) => ({ ...f, job_type: type || undefined }))
  }

  return (
    <>
      <JobFiltersUI
        equipmentCode={filters.equipment_code ?? ''}
        jobType={filters.job_type ?? ''}
        onEquipmentChange={handleEquipmentChange}
        onJobTypeChange={handleJobTypeChange}
      />

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* 일감 수 헤더 */}
        {!isLoading && !isError && (
          <p className="text-slate-500 text-sm mb-4">
            일감 <span className="text-white font-semibold">{totalCount.toLocaleString()}</span>개
          </p>
        )}

        {/* 로딩 스켈레톤 */}
        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-slate-800/40 rounded-2xl h-36 animate-pulse" />
            ))}
          </div>
        )}

        {/* 에러 */}
        {isError && (
          <div className="text-center py-20">
            <p className="text-slate-400">일감을 불러오지 못했습니다.</p>
            <p className="text-slate-600 text-sm mt-1">잠시 후 다시 시도해주세요.</p>
          </div>
        )}

        {/* 빈 목록 */}
        {!isLoading && !isError && jobs.length === 0 && (
          <div className="text-center py-20">
            <p className="text-slate-300 text-lg font-medium mb-2">등록된 일감이 없습니다</p>
            <p className="text-slate-500 text-sm">필터를 변경하거나 나중에 다시 확인해보세요.</p>
          </div>
        )}

        {/* 일감 카드 목록 */}
        <div className="space-y-4">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} isPreferred={isPreferred(job)} />
          ))}
        </div>

        {/* 무한스크롤 트리거 & 상태 표시 */}
        <div ref={loadMoreRef} className="py-8 flex justify-center">
          {isFetchingNextPage && (
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <div className="w-4 h-4 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
              불러오는 중...
            </div>
          )}
          {!hasNextPage && jobs.length > 0 && (
            <p className="text-slate-700 text-sm">모든 일감을 확인했습니다</p>
          )}
        </div>
      </main>
    </>
  )
}
