'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import type { EquipmentCode, JobType, JobWithManager } from '@/types'

export interface JobFilters {
  equipment_code?: EquipmentCode | ''
  job_type?: JobType | ''
}

interface JobsPage {
  data: JobWithManager[]
  count: number
  page: number
  limit: number
}

async function fetchJobs({ pageParam, filters }: { pageParam: number; filters: JobFilters }): Promise<JobsPage> {
  const params = new URLSearchParams({ page: String(pageParam), limit: '10', status: 'open' })
  if (filters.equipment_code) params.set('equipment_code', filters.equipment_code)
  if (filters.job_type) params.set('job_type', filters.job_type)

  const res = await fetch(`/api/jobs?${params}`)
  if (!res.ok) throw new Error('일감 목록을 불러오지 못했습니다.')
  return res.json()
}

export function useJobs(filters: JobFilters = {}) {
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
