import { cacheLife, cacheTag } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/server'
import { getServerTodayStr } from '@/lib/utils/date'
import { JOBS_FIRST_PAGE_LIMIT } from '@/lib/constants'

// 일감 목록 첫 페이지 — deadline(work_date ASC) 정렬, 공개 데이터
export async function getCachedJobsFirstPage() {
  'use cache'
  cacheLife('seconds')
  cacheTag('jobs')

  const supabase = createPublicClient()
  const today = getServerTodayStr()
  const { data, count } = await supabase
    .from('jobs')
    .select('*, profiles(id, name, rating_avg, review_count, is_certified, avatar_url, penalty_count)', { count: 'exact' })
    .eq('status', 'open')
    .gte('work_date', today)
    .order('work_date', { ascending: true })
    .range(0, JOBS_FIRST_PAGE_LIMIT - 1)

  return { data: data ?? [], count: count ?? 0, offset: 0, limit: JOBS_FIRST_PAGE_LIMIT }
}

// 일감 상세 — 공개 데이터만 (사용자 세션 없음)
export async function getCachedJobDetail(id: string) {
  'use cache'
  cacheLife('minutes')
  cacheTag('jobs')

  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('jobs')
    .select('*, profiles(id, name, rating_avg, review_count, is_certified, avatar_url, penalty_count)')
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data
}
