'use client'

// 소장 내 일감 목록 페이지
import { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import { useRouter, useSearchParams } from 'next/navigation'
import { ExcavatorIcon } from '@/components/ui/ExcavatorIcon'
import { NavButtons } from '@/components/features/home/NavButtons'
import { NavRoleLink } from '@/components/features/home/NavRoleLink'
import { ManagerJobCard } from '@/components/features/manager/ManagerJobCard'
import type { Job, JobStatus } from '@/types'

type FilterValue = 'all' | JobStatus | 'reviewing'

interface AcceptedDriver {
  driver_id: string
  applied_equipment_code: string | null
}

interface JobWithCount extends Job {
  applicant_count: number
  pending_count: number
  reviewing_count: number
  accepted_drivers?: AcceptedDriver[]
}

const TABS: { value: FilterValue; label: string }[] = [
  { value: 'all',         label: '전체' },
  { value: 'open',        label: '모집중' },
  { value: 'reviewing',   label: '검토중' },
  { value: 'closed',      label: '모집마감' },
  { value: 'in_progress', label: '작업중' },
  { value: 'completed',   label: '정산대기' },
  { value: 'settled',     label: '정산완료' },
]

function ManagerJobsContent() {
  const { user, role, isLoading: authLoading } = useAuthStore()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [jobs, setJobs] = useState<JobWithCount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<FilterValue>(() => {
    const s = searchParams.get('status')
    return TABS.some((t) => t.value === s) ? (s as FilterValue) : 'all'
  })
  // "jobId:driverId" 형태로 저장 — 기사별 리뷰 완료 판단
  const [reviewedPairs, setReviewedPairs] = useState<Set<string>>(new Set())
  const [tabScroll, setTabScroll] = useState({ canLeft: false, canRight: true })
  const tabScrollRef = useRef<HTMLDivElement>(null)

  function handleTabScroll() {
    const el = tabScrollRef.current
    if (!el) return
    setTabScroll({
      canLeft: el.scrollLeft > 0,
      canRight: el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
    })
  }

  useEffect(() => {
    requestAnimationFrame(handleTabScroll)
  }, [])

  useEffect(() => {
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
        const pairs = new Set<string>(
          (reviewsJson.data ?? [] as { job_id: string; reviewee_id: string }[]).map(
            (r: { job_id: string; reviewee_id: string }) => `${r.job_id}:${r.reviewee_id}`
          )
        )
        setReviewedPairs(pairs)
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

  const isReviewing = (job: JobWithCount) => (job.reviewing_count ?? 0) > 0

  const filtered = sorted.filter((job) => {
    if (filter === 'all') return true
    if (filter === 'reviewing') return isReviewing(job)
    if (filter === 'open') return effectiveStatus(job) === 'open' && !isReviewing(job)
    return effectiveStatus(job) === filter
  })

  const counts: Record<FilterValue, number> = {
    all:         jobs.length,
    open:        jobs.filter((j) => effectiveStatus(j) === 'open' && !isReviewing(j)).length,
    reviewing:   jobs.filter((j) => isReviewing(j)).length,
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

          {/* 필터 탭 + 등록 버튼 */}
          <div className="flex items-center gap-3 mb-5">
            <div className="relative flex-1 min-w-0">
              <div
                ref={tabScrollRef}
                className="overflow-x-auto no-scrollbar"
                onScroll={handleTabScroll}
              >
                <div className="flex gap-1.5 pb-1 w-max pr-8">
                  {TABS.map((tab) => {
                    const count = counts[tab.value]
                    return (
                      <button
                        key={tab.value}
                        onClick={() => {
                            setFilter(tab.value)
                            const p = new URLSearchParams(searchParams.toString())
                            if (tab.value === 'all') p.delete('status')
                            else p.set('status', tab.value)
                            router.replace(`?${p.toString()}`, { scroll: false })
                          }}
                        className={`shrink-0 text-xs font-semibold px-3.5 py-1.5 rounded-full transition-colors ${
                          filter === tab.value
                            ? 'bg-blue-500 text-white'
                            : 'bg-white border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600'
                        }`}
                      >
                        {tab.label}{count > 0 ? ` (${count})` : ''}
                      </button>
                    )
                  })}
                </div>
              </div>
              {tabScroll.canLeft && (
                <div className="absolute left-0 top-0 bottom-1 flex items-center bg-gradient-to-r from-gray-50 via-gray-50/90 to-transparent pr-6">
                  <button
                    onClick={() => tabScrollRef.current?.scrollBy({ left: -160, behavior: 'smooth' })}
                    aria-label="이전 필터"
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm text-gray-500 active:scale-95 transition-transform"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              )}
              {tabScroll.canRight && (
                <div className="absolute right-0 top-0 bottom-1 flex items-center bg-gradient-to-l from-gray-50 via-gray-50/90 to-transparent pl-6">
                  <button
                    onClick={() => tabScrollRef.current?.scrollBy({ left: 160, behavior: 'smooth' })}
                    aria-label="다음 필터"
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm text-gray-500 active:scale-95 transition-transform"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            <Link
              href="/jobs/new"
              className="hidden md:block shrink-0 text-sm bg-blue-500 hover:bg-blue-600 text-white font-bold px-4 py-2 rounded-xl transition-colors"
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
                  reviewedPairs={reviewedPairs}
                />
              ))}
            </div>
          )}

        </div>
      </div>

      {/* 모바일 FAB */}
      <Link
        href="/jobs/new"
        className="md:hidden fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-xl shadow-blue-500/30 active:scale-95 transition-all"
        aria-label="일감 등록"
      >
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </Link>
    </div>
  )
}

export default function ManagerJobsPage() {
  return (
    <Suspense>
      <ManagerJobsContent />
    </Suspense>
  )
}
