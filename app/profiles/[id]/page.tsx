// 공개 프로필 페이지 — 소장/기사 역할별 분기, 서버 컴포넌트
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PublicProfile from '@/components/features/profile/PublicProfile'
import type { Job } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ProfilePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  // 1단계: 프로필 조회 (role 확인 필요)
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, role, bio, avatar_url, rating_avg, review_count, is_certified, experience_years')
    .eq('id', id)
    .single()

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3 text-center px-6">
        <p className="text-4xl">😶</p>
        <p className="text-base font-semibold text-slate-700">존재하지 않는 회원입니다.</p>
        <p className="text-sm text-gray-400">URL을 다시 확인해 주세요.</p>
      </div>
    )
  }

  const isManager = profile.role === 'manager'

  // 2단계: 역할별 병렬 패칭
  const [reviewsResult, jobsResult, matchCountResult] = await Promise.all([
    // 받은 리뷰 (reviewer 이름 + 일감 제목 포함)
    supabase
      .from('reviews')
      .select('id, rating, comment, created_at, reviewer_id, job_id')
      .eq('reviewee_id', id)
      .order('rating', { ascending: false }),

    // 소장: 모집중 일감 / 기사: 불필요 (빈 배열 반환)
    isManager
      ? supabase
          .from('jobs')
          .select('id, title, work_date, location, equipment_codes, job_type')
          .eq('manager_id', id)
          .eq('status', 'open')
          .gte('work_date', new Date().toISOString().split('T')[0])
          .order('work_date', { ascending: true })
      : Promise.resolve({ data: [] as Pick<Job, 'id' | 'title' | 'work_date' | 'location' | 'equipment_codes' | 'job_type'>[] | null }),

    // 총 매칭 완료 수
    isManager
      ? supabase
          .from('jobs')
          .select('id', { count: 'exact', head: true })
          .eq('manager_id', id)
          .in('status', ['completed', 'settled'])
      : supabase
          .from('applications')
          .select('id', { count: 'exact', head: true })
          .eq('driver_id', id)
          .eq('status', 'accepted'),
  ])

  const rawReviews = reviewsResult.data ?? []
  const openJobs = (jobsResult.data ?? []) as Pick<Job, 'id' | 'title' | 'work_date' | 'location' | 'equipment_codes' | 'job_type'>[]
  const matchCount = matchCountResult.count ?? 0

  // 리뷰 reviewer 이름 + 일감 제목 보강
  let reviews: { id: string; rating: number; comment: string | null; created_at: string; reviewer_name: string | null; job_title: string | null }[] = []

  if (rawReviews.length > 0) {
    const reviewerIds = Array.from(new Set(rawReviews.map((r) => r.reviewer_id)))
    const jobIds = Array.from(new Set(rawReviews.map((r) => r.job_id)))

    const [{ data: reviewers }, { data: jobs }] = await Promise.all([
      supabase.from('profiles').select('id, name').in('id', reviewerIds),
      supabase.from('jobs').select('id, title').in('id', jobIds),
    ])

    const reviewerMap = new Map((reviewers ?? []).map((p) => [p.id, p.name]))
    const jobMap = new Map((jobs ?? []).map((j) => [j.id, j.title]))

    reviews = rawReviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
      reviewer_name: reviewerMap.get(r.reviewer_id) ?? null,
      job_title: jobMap.get(r.job_id) ?? null,
    }))
  }

  return (
    <PublicProfile
      profile={profile}
      reviews={reviews}
      openJobs={openJobs}
      matchCount={matchCount}
    />
  )
}
