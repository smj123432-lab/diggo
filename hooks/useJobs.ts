'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import type { EquipmentCode, JobType, JobWithManager } from '@/types'

export interface JobFilters {
  equipment_codes: EquipmentCode[]
  job_types: JobType[]
  keyword?: string
}

export const DEFAULT_FILTERS: JobFilters = { equipment_codes: [], job_types: [] }

interface JobsPage {
  data: JobWithManager[]
  count: number
  page: number
  limit: number
}

async function fetchJobs({ pageParam, filters }: { pageParam: number; filters: JobFilters }): Promise<JobsPage> {
  const params = new URLSearchParams({ page: String(pageParam), limit: '12' })
  filters.equipment_codes.forEach((code) => params.append('equipment_code', code))
  filters.job_types.forEach((type) => params.append('job_type', type))
  if (filters.keyword) params.set('keyword', filters.keyword)

  const res = await fetch(`/api/jobs?${params}`)
  if (!res.ok) throw new Error('일감 목록을 불러오지 못했습니다.')
  return res.json()
}

export function useJobs(filters: JobFilters = DEFAULT_FILTERS) {
  return useInfiniteQuery({
    queryKey: ['jobs', filters],
    queryFn: ({ pageParam }) => fetchJobs({ pageParam: pageParam as number, filters }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, count, limit } = lastPage
      return page * limit < count ? page + 1 : undefined
    },
    staleTime: 30 * 1000,
  })
}
