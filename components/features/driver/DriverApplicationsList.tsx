'use client'

// 기사 — 지원한 일감 목록 + 4단계 필터
import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import type { EquipmentCode, JobStatus } from '@/types'
import { EquipmentBadge } from '@/components/ui/EquipmentBadge'
import { ReviewModal } from '@/components/features/mypage/ReviewModal'
import { useAuthStore } from '@/store/auth'

export interface DriverApplication {
  id: string
  status: string
  applied_at: string
  hasReview: boolean
  job: {
    id: string
    title: string
    work_date: string
    status: JobStatus
    equipment_codes: EquipmentCode[]
    location: string
    pay_amounts: Record<string, number>
    manager_id: string
  }
  equipment: { id: string; model_code: EquipmentCode } | null
}

type StageFilter = 'all' | 'applying' | 'confirmed' | 'pending_settlement' | 'settled'

const STAGE_TABS: { value: StageFilter; label: string; desc: string }[] = [
  { value: 'all',                label: '전체',    desc: '' },
  { value: 'applying',           label: '지원중',  desc: '소장님 선택 대기' },
  { value: 'confirmed',          label: '배차완료', desc: '출근 확정' },
  { value: 'pending_settlement', label: '정산대기', desc: '입금 대기' },
  { value: 'settled',            label: '정산완료', desc: '입금 완료' },
]

const STAGE_BAR: Record<StageFilter, string> = {
  all:                '',
  applying:           'bg-blue-400',
  confirmed:          'bg-emerald-400',
  pending_settlement: 'bg-amber-400',
  settled:            'bg-emerald-400',
}

const STAGE_BADGE: Record<StageFilter, string> = {
  all:                '',
  applying:           'bg-blue-50 text-blue-700',
  confirmed:          'bg-emerald-50 text-emerald-700',
  pending_settlement: 'bg-amber-50 text-amber-700',
  settled:            'bg-emerald-50 text-emerald-700',
}

function getStage(appStatus: string, jobStatus: JobStatus): StageFilter {
  if (appStatus === 'pending' || appStatus === 'reviewing') return 'applying'
  if (appStatus === 'accepted') {
    if (jobStatus === 'settled') return 'settled'
    if (jobStatus === 'completed') return 'pending_settlement'
    return 'confirmed'
  }
  return 'applying'
}

interface Props {
  applications: DriverApplication[]
}

export function DriverApplicationsList({ applications }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentUserId = useAuthStore((s) => s.user?.id)
  const [filter, setFilter] = useState<StageFilter>(() => {
    const s = searchParams.get('stage')
    return STAGE_TABS.some((t) => t.value === s) ? (s as StageFilter) : 'all'
  })
  const [reviewTarget, setReviewTarget] = useState<{ jobId: string; managerId: string } | null>(null)
  const [chattingJobId, setChattingJobId] = useState<string | null>(null)

  const handleOpenChat = useCallback(async (jobId: string) => {
    if (!currentUserId) return
    setChattingJobId(jobId)
    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId, driver_id: currentUserId }),
      })
      const json = await res.json() as { data?: { id: string }; error?: string }
      if (!res.ok) throw new Error(json.error)
      router.push(`/chats/${json.data!.id}`)
    } catch {
      toast.error('채팅방을 열지 못했습니다.')
    } finally {
      setChattingJobId(null)
    }
  }, [router, currentUserId])
  const [tabScrollState, setTabScrollState] = useState({ canLeft: false, canRight: true })
  const tabScrollRef = useRef<HTMLDivElement>(null)

  function handleTabScroll() {
    const el = tabScrollRef.current
    if (!el) return
    setTabScrollState({
      canLeft: el.scrollLeft > 0,
      canRight: el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
    })
  }

  useEffect(() => {
    requestAnimationFrame(handleTabScroll)
  }, [])
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(
    () => new Set(applications.filter((a) => a.hasReview).map((a) => a.id))
  )

  const withStage = applications.map((app) => ({
    ...app,
    stage: app.status === 'rejected' ? null : getStage(app.status, app.job.status),
  }))

  const counts: Record<StageFilter, number> = {
    all:                applications.filter((a) => a.status !== 'rejected').length,
    applying:           withStage.filter((a) => a.stage === 'applying').length,
    confirmed:          withStage.filter((a) => a.stage === 'confirmed').length,
    pending_settlement: withStage.filter((a) => a.stage === 'pending_settlement').length,
    settled:            withStage.filter((a) => a.stage === 'settled').length,
  }

  const filtered = withStage
    .filter((app) => filter === 'all' || app.stage === filter)
    .sort((a, b) => {
      if (filter === 'all') {
        // 정산완료·거절은 하단
        const aBottom = a.stage === 'settled' || a.stage === null
        const bBottom = b.stage === 'settled' || b.stage === null
        if (aBottom !== bBottom) return aBottom ? 1 : -1
      }
      return new Date(a.job.work_date).getTime() - new Date(b.job.work_date).getTime()
    })

  return (
    <>
      {/* 필터 탭 */}
      <div className="relative mb-5">
        <div
          ref={tabScrollRef}
          className="overflow-x-auto no-scrollbar"
          onScroll={handleTabScroll}
        >
          <div className="flex gap-1.5 pb-1 w-max pr-10">
            {STAGE_TABS.map((tab) => {
              const count = counts[tab.value]
              return (
                <button
                  key={tab.value}
                  onClick={() => {
                    setFilter(tab.value)
                    const p = new URLSearchParams(searchParams.toString())
                    if (tab.value === 'all') p.delete('stage')
                    else p.set('stage', tab.value)
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
        {tabScrollState.canLeft && (
          <div className="absolute left-0 top-0 bottom-1 flex items-center bg-gradient-to-r from-white via-white/90 to-transparent pr-6">
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
        {tabScrollState.canRight && (
          <div className="absolute right-0 top-0 bottom-1 flex items-center bg-gradient-to-l from-white via-white/90 to-transparent pl-6">
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

      <p className="text-sm font-semibold text-gray-700 mb-4">{filtered.length}건</p>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-sm mb-4">
            {filter === 'all' ? '아직 지원한 일감이 없습니다.' : '해당 단계의 일감이 없습니다.'}
          </p>
          {filter === 'all' && (
            <Link
              href="/jobs"
              className="inline-block bg-blue-500 text-white font-bold px-6 py-3 rounded-2xl text-sm hover:bg-blue-600 transition-colors"
            >
              일감 찾아보기
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((app) => {
            const { job, equipment, stage } = app
            const effectiveStage = stage ?? 'applying'
            const isSettled = effectiveStage === 'settled'
            const isRejected = app.status === 'rejected'
            const alreadyReviewed = reviewedIds.has(app.id)

            const workDate = new Date(job.work_date).toLocaleDateString('ko-KR', {
              month: 'numeric', day: 'numeric', weekday: 'short',
            })

            const payValues = Object.values(job.pay_amounts)
            const payMin = Math.min(...payValues)
            const payMax = Math.max(...payValues)
            const payText = payMin === payMax
              ? `${payMin.toLocaleString()}원`
              : `${payMin.toLocaleString()}~${payMax.toLocaleString()}원`

            const stageLabel = STAGE_TABS.find((t) => t.value === effectiveStage)

            const cardContent = (
              <div className={`bg-white border rounded-2xl overflow-hidden flex transition-all ${
                isRejected ? 'border-gray-100 opacity-60' :
                isSettled ? 'border-gray-200' :
                'border-gray-200 hover:border-blue-300 hover:shadow-md'
              }`}>
                {/* 좌측 컬러 바 */}
                {!isRejected && (
                  <div className={`w-1.5 shrink-0 ${STAGE_BAR[effectiveStage]}`} />
                )}

                <div className="flex-1 px-4 py-4 flex items-center gap-4">
                  {/* 좌측: 뱃지·제목·위치 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-2">
                      {isRejected ? (
                        <span className="bg-red-50 text-red-400 text-xs font-semibold px-2 py-0.5 rounded-md">
                          거절됨
                        </span>
                      ) : (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${STAGE_BADGE[effectiveStage]}`}>
                          {stageLabel?.label}
                        </span>
                      )}
                      {equipment && <EquipmentBadge code={equipment.model_code} size="sm" />}
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-1">{job.title}</h3>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      {job.location}
                    </p>
                  </div>

                  {/* 우측: 날짜·금액·리뷰/채팅 버튼 */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-xs text-slate-400">{workDate}</span>
                    <span className="text-sm font-bold text-gray-800">{payText}</span>
                    {!isRejected && isSettled ? (
                      alreadyReviewed ? (
                        <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg">
                          평가 완료
                        </span>
                      ) : (
                        <button
                          onClick={() => setReviewTarget({ jobId: job.id, managerId: job.manager_id })}
                          className="text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-lg transition-colors active:scale-95"
                        >
                          리뷰 남기기
                        </button>
                      )
                    ) : (
                      !isRejected && stageLabel?.desc && (
                        <span className="text-xs text-gray-400">{stageLabel.desc}</span>
                      )
                    )}
                    {/* accepted 상태 카드에 채팅 아이콘 */}
                    {app.status === 'accepted' && !isRejected && (
                      <button
                        onClick={(e) => { e.preventDefault(); handleOpenChat(job.id) }}
                        disabled={chattingJobId === job.id}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-500 disabled:opacity-50 transition-colors"
                        title="채팅하기"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {chattingJobId === job.id ? '연결중' : '채팅'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )

            // 정산완료 항목은 Link 없이 렌더링 (리뷰 버튼 클릭 시 이동 방지)
            if (isSettled) {
              return <div key={app.id}>{cardContent}</div>
            }

            return (
              <Link key={app.id} href={`/jobs/${job.id}`} className="block">
                {cardContent}
              </Link>
            )
          })}
        </div>
      )}

      {/* 리뷰 모달 */}
      {reviewTarget && (
        <ReviewModal
          jobId={reviewTarget.jobId}
          revieweeId={reviewTarget.managerId}
          revieweeRole="manager"
          onClose={() => setReviewTarget(null)}
          onSuccess={() => {
            // 해당 app.id를 찾아서 완료 처리
            const appId = applications.find((a) => a.job.id === reviewTarget.jobId)?.id
            if (appId) setReviewedIds((prev) => { const next = new Set(prev); next.add(appId); return next })
            setReviewTarget(null)
          }}
        />
      )}
    </>
  )
}
