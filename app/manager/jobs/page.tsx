'use client'

// 소장 내 일감 목록 페이지
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'
import { ExcavatorIcon } from '@/components/ui/ExcavatorIcon'
import { NavButtons } from '@/components/features/home/NavButtons'
import { NavRoleLink } from '@/components/features/home/NavRoleLink'
import { ManagerJobCard } from '@/components/features/manager/ManagerJobCard'
import { ManagerJobStatusFilter } from '@/components/features/manager/ManagerJobStatusFilter'
import type { Job, JobStatus } from '@/types'

type FilterValue = 'all' | JobStatus

interface JobWithCount extends Job {
  applicant_count: number
  pending_count: number
  accepted_driver_id?: string | null
}

export default function ManagerJobsPage() {
  const { user, role, isLoading: authLoading } = useAuthStore()
  const router = useRouter()
  const [jobs, setJobs] = useState<JobWithCount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<FilterValue>('all')
  const [reviewedJobIds, setReviewedJobIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    // role이 null이면 아직 프로필 fetch 중 — 리다이렉트 보류
    if (!authLoading && role !== null && (!user || role !== 'manager')) {
      router.replace('/jobs')
    }
  }, [user, role, authLoading, router])

  useEffect(() => {
    if (!user || role !== 'manager') return
    setIsLoading(true)

    Promise.all([
      fetch('/api/jobs/mine').then((r) => r.json()),
      fetch('/api/reviews?type=given').then((r) => r.json()),
    ])
      .then(([jobsJson, reviewsJson]) => {
        setJobs(jobsJson.data ?? [])
        setReviewedJobIds(new Set<string>((reviewsJson.data ?? []) as string[]))
      })
      .finally(() => setIsLoading(false))
  }, [user, role])

  const today = new Date().toISOString().split('T')[0]

  const effectiveStatus = (job: JobWithCount): JobStatus =>
    job.status === 'open' && job.work_date < today ? 'closed' : job.status

  const sorted = [...jobs].sort((a, b) => {
    const createdDiff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    if (createdDiff !== 0) return createdDiff
    return new Date(b.work_date).getTime() - new Date(a.work_date).getTime()
  })

  const filtered = sorted.filter((job) =>
    filter === 'all' || effectiveStatus(job) === filter
  )

  const counts: Record<FilterValue, number> = {
    all:         jobs.length,
    open:        jobs.filter((j) => effectiveStatus(j) === 'open').length,
    closed:      jobs.filter((j) => effectiveStatus(j) === 'closed').length,
    in_progress: jobs.filter((j) => effectiveStatus(j) === 'in_progress').length,
    completed:   jobs.filter((j) => effectiveStatus(j) === 'completed').length,
    settled:     jobs.filter((j) => effectiveStatus(j) === 'settled').length,
  }

  if (authLoading || role === null) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/10 bg-slate-900/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <ExcavatorIcon className="w-10 h-8 text-blue-400" />
            <span className="text-lg font-black tracking-tight text-white">
              Diggo<span className="text-blue-400">.</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-1">
            <Link href="/jobs" className="px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
              일감 찾기
            </Link>
            <Link href="/mypage/ledger" className="px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
              장부
            </Link>
            <NavRoleLink />
          </div>
          <NavButtons />
        </div>
      </nav>

      <div className="pt-16">
        <div className="max-w-3xl mx-auto px-4 py-6">

          <div className="flex items-center justify-between mb-5">
            <ManagerJobStatusFilter value={filter} onChange={setFilter} counts={counts} />
            <Link
              href="/jobs/new"
              className="shrink-0 ml-3 text-sm bg-blue-500 hover:bg-blue-600 text-white font-bold px-4 py-2 rounded-xl transition-colors"
            >
              + 등록
            </Link>
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse h-28" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 text-sm mb-4">
                {filter === 'all' ? '등록한 일감이 없습니다.' : '해당 상태의 일감이 없습니다.'}
              </p>
              {filter === 'all' && (
                <Link
                  href="/jobs/new"
                  className="inline-block bg-blue-500 text-white font-bold px-6 py-3 rounded-2xl text-sm hover:bg-blue-600 transition-colors"
                >
                  첫 일감 등록하기
                </Link>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filtered.map((job) => (
                <ManagerJobCard
                  key={job.id}
                  job={job}
                  hasReview={reviewedJobIds.has(job.id)}
                />
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
