'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import type { EquipmentCode, JobType, JobWithManager } from '@/types'

export type SortBy = 'latest' | 'deadline' | 'preferred'

export interface JobFilters {
  equipment_codes: EquipmentCode[]
  job_types: JobType[]
  keyword?: string
  sortBy: SortBy
}

export const DEFAULT_FILTERS: JobFilters = { equipment_codes: [], job_types: [], sortBy: 'latest' }

interface JobsPage {
  data: JobWithManager[]
  count: number
  offset: number
  limit: number
}

// 첫 페이지 12개, 이후 8개씩
const FIRST_LIMIT = 12
const NEXT_LIMIT = 8

async function fetchJobs({ pageParam, filters }: { pageParam: number; filters: JobFilters }): Promise<JobsPage> {
  const offset = pageParam
  const limit = offset === 0 ? FIRST_LIMIT : NEXT_LIMIT
  const params = new URLSearchParams({ offset: String(offset), limit: String(limit) })
  filters.equipment_codes.forEach((code) => params.append('equipment_code', code))
  filters.job_types.forEach((type) => params.append('job_type', type))
  if (filters.keyword) params.set('keyword', filters.keyword)
  // preferred는 서버 정렬 없이 client-side 처리 → API엔 latest로 전달
  const apiSort = filters.sortBy === 'preferred' ? 'latest' : filters.sortBy
  if (apiSort !== 'latest') params.set('sortBy', apiSort)

  const res = await fetch(`/api/jobs?${params}`)
  if (!res.ok) throw new Error('일감 목록을 불러오지 못했습니다.')
  return res.json()
}

export function useJobs(filters: JobFilters = DEFAULT_FILTERS) {
  return useInfiniteQuery({
    queryKey: ['jobs', filters],
    queryFn: ({ pageParam }) => fetchJobs({ pageParam: pageParam as number, filters }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const { offset, count, limit } = lastPage
      return offset + limit < count ? offset + limit : undefined
    },
    staleTime: 30 * 1000,
  })
}
