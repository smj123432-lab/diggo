'use client'

// 소장 내 일감 카드 — 좌측 컬러 바 + 정보 우측 정렬
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { Job, JobStatus, EquipmentCode } from '@/types'
import { JOB_STATUS_LABELS, PAY_DUE_LABELS } from '@/types'
import { EquipmentBadge } from '@/components/ui/EquipmentBadge'
import { ReviewModal } from '@/components/features/mypage/ReviewModal'

interface ManagerJobCardProps {
  job: Job & { applicant_count: number; pending_count: number; accepted_driver_id?: string | null }
  hasReview?: boolean
}

const STATUS_BAR: Record<JobStatus, string> = {
  open:        'bg-emerald-400',
  closed:      'bg-gray-300',
  in_progress: 'bg-blue-400',
  completed:   'bg-emerald-400',
  settled:     'bg-emerald-400',
}

const STATUS_BADGE: Record<JobStatus, string> = {
  open:        'text-emerald-700 bg-emerald-50',
  closed:      'text-gray-500 bg-gray-100',
  in_progress: 'text-blue-700 bg-blue-50',
  completed:   'text-emerald-700 bg-emerald-50',
  settled:     'text-emerald-700 bg-emerald-50',
}

export function ManagerJobCard({ job, hasReview = false }: ManagerJobCardProps) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [reviewed, setReviewed] = useState(hasReview)
  const [revieweeId, setRevieweeId] = useState<string | null>(job.accepted_driver_id ?? null)
  const [fetching, setFetching] = useState(false)
  const [completing, setCompleting] = useState(false)

  async function handleComplete(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!window.confirm('작업이 완료됐나요? 정산대기 상태로 전환됩니다.')) return
    setCompleting(true)
    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      })
      if (!res.ok) throw new Error()
      toast.success('작업 완료 처리됐습니다. 정산대기로 전환됩니다.')
      router.refresh()
    } catch {
      toast.error('상태 변경에 실패했습니다.')
    } finally {
      setCompleting(false)
    }
  }

  const workDate = new Date(job.work_date).toLocaleDateString('ko-KR', {
    month: 'numeric', day: 'numeric', weekday: 'short',
  })

  const today = new Date().toISOString().split('T')[0]
  const effectiveStatus: JobStatus =
    job.status === 'open' && job.work_date < today ? 'closed' : job.status

  const showApplicants = effectiveStatus === 'open' || effectiveStatus === 'closed'
  const isSettled = effectiveStatus === 'settled'

  async function handleReviewClick() {
    let driverId = revieweeId

    if (!driverId) {
      setFetching(true)
      try {
        const res = await fetch(`/api/jobs/${job.id}/accepted-driver`)
        const json = await res.json()
        driverId = json.driver_id ?? null
        if (driverId) setRevieweeId(driverId)
      } catch {
        toast.error('기사 정보를 불러오지 못했습니다.')
        setFetching(false)
        return
      }
      setFetching(false)
    }

    if (driverId) {
      setModalOpen(true)
    } else {
      toast.error('배차된 기사 정보를 찾을 수 없습니다.')
    }
  }

  const cardBody = (
    <div className={`bg-white border border-gray-200 rounded-2xl overflow-hidden flex ${
      !isSettled ? 'hover:border-blue-300 hover:shadow-md transition-all cursor-pointer' : ''
    }`}>
      <div className={`w-1.5 shrink-0 ${STATUS_BAR[effectiveStatus]}`} />

      <div className="flex-1 px-4 py-4 flex items-center gap-4">
        {/* 좌측: 뱃지·제목·위치 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-2">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${STATUS_BADGE[effectiveStatus]}`}>
              {JOB_STATUS_LABELS[effectiveStatus]}
            </span>
            {(job.equipment_codes as EquipmentCode[]).map((code) => (
              <EquipmentBadge key={code} code={code} size="sm" />
            ))}
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

        {/* 우측: 날짜·지급일 + 액션 */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <p className="text-xs text-slate-400">
            {workDate} · {PAY_DUE_LABELS[job.pay_due_type]}
          </p>
          {showApplicants ? (
            <div className="flex items-center gap-1.5">
              {job.pending_count > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  NEW {job.pending_count}
                </span>
              )}
              <span className="bg-emerald-50 text-emerald-700 font-medium text-sm rounded-lg px-4 py-2 hover:bg-emerald-100 transition-colors whitespace-nowrap">
                지원자 {job.applicant_count}명 →
              </span>
            </div>
          ) : isSettled ? (
            reviewed ? (
              <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg">
                평가 완료
              </span>
            ) : (
              <button
                onClick={handleReviewClick}
                disabled={fetching}
                className="text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-lg transition-colors active:scale-95 disabled:opacity-50"
              >
                {fetching ? '...' : '리뷰 남기기'}
              </button>
            )
          ) : effectiveStatus === 'in_progress' ? (
            <button
              onClick={handleComplete}
              disabled={completing}
              className="text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition-colors active:scale-95 disabled:opacity-50 whitespace-nowrap"
            >
              {completing ? '처리중...' : '작업 완료'}
            </button>
          ) : (
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">
              정산 대기중
            </span>
          )}
        </div>
      </div>
    </div>
  )

  // 정산완료는 Link 없이 — 버튼 클릭 이벤트 간섭 방지
  if (isSettled) {
    return (
      <>
        <div>{cardBody}</div>
        {modalOpen && revieweeId && (
          <ReviewModal
            jobId={job.id}
            revieweeId={revieweeId}
            revieweeRole="driver"
            onClose={() => setModalOpen(false)}
            onSuccess={() => { setReviewed(true); setModalOpen(false) }}
          />
        )}
      </>
    )
  }

  return (
    <Link href={showApplicants ? `/manager/jobs/${job.id}/applicants` : `/jobs/${job.id}`} className="block">
      {cardBody}
    </Link>
  )
}
