'use client'

// 소장 내 일감 카드 — 정산완료 시 리뷰 버튼 단일화 + 기사 수 기반 모달 라우팅
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createPortal } from 'react-dom'
import type { Job, JobStatus, EquipmentCode } from '@/types'
import { JOB_STATUS_LABELS, PAY_DUE_LABELS, EQUIPMENT_LABELS } from '@/types'
import { EquipmentBadge } from '@/components/ui/EquipmentBadge'
import { ReviewModal } from '@/components/features/mypage/ReviewModal'

interface AcceptedDriver {
  driver_id: string
  applied_equipment_code: string | null
}

interface ManagerJobCardProps {
  job: Job & {
    applicant_count: number
    pending_count: number
    reviewing_count: number
    accepted_drivers?: AcceptedDriver[]
  }
  reviewedPairs?: Set<string>  // "jobId:driverId" 형태
}

// null → 모달 없음 / 'selecting' → 기사 선택 / 'reviewing' → 리뷰 작성
type ModalState = null | 'selecting' | 'reviewing'

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

export function ManagerJobCard({ job, reviewedPairs = new Set() }: ManagerJobCardProps) {
  const router = useRouter()
  const [modalState, setModalState] = useState<ModalState>(null)
  const [selectedDriver, setSelectedDriver] = useState<AcceptedDriver | null>(null)

  // 로컬에서 즉시 반영 — 페이지 리프레시 없이 버튼 상태 업데이트
  const [localReviewed, setLocalReviewed] = useState<Set<string>>(
    new Set([...reviewedPairs].filter((k) => k.startsWith(`${job.id}:`)))
  )
  const [completing, setCompleting] = useState(false)

  const acceptedDrivers = job.accepted_drivers ?? []
  const allReviewed =
    acceptedDrivers.length > 0 &&
    acceptedDrivers.every((d) => localReviewed.has(`${job.id}:${d.driver_id}`))

  function getEquipmentLabel(driver: AcceptedDriver, index: number): string {
    if (driver.applied_equipment_code) {
      return EQUIPMENT_LABELS[driver.applied_equipment_code as EquipmentCode] ?? driver.applied_equipment_code
    }
    const fallback = (job.equipment_codes as EquipmentCode[])[index]
    return fallback ? EQUIPMENT_LABELS[fallback] : '기사'
  }

  function handleReviewButtonClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (acceptedDrivers.length === 0) return

    if (acceptedDrivers.length === 1) {
      // 기사 1명 → 바로 리뷰 모달
      setSelectedDriver(acceptedDrivers[0])
      setModalState('reviewing')
    } else {
      // 기사 2명 이상 → 선택 모달 먼저
      setModalState('selecting')
    }
  }

  function handleDriverSelect(driver: AcceptedDriver) {
    setSelectedDriver(driver)
    setModalState('reviewing')
  }

  function handleReviewModalClose() {
    if (acceptedDrivers.length > 1) {
      // 복수 기사 케이스: X 눌러도 선택 모달로 복귀
      setModalState('selecting')
    } else {
      setModalState(null)
    }
    setSelectedDriver(null)
  }

  function handleReviewSuccess() {
    if (!selectedDriver) return

    const newReviewed = new Set([...localReviewed, `${job.id}:${selectedDriver.driver_id}`])
    setLocalReviewed(newReviewed)

    const remaining = acceptedDrivers.filter((d) => !newReviewed.has(`${job.id}:${d.driver_id}`))

    if (acceptedDrivers.length > 1 && remaining.length > 0) {
      // 아직 남은 기사 있음 → 선택 모달로 복귀
      setModalState('selecting')
      setSelectedDriver(null)
    } else {
      // 모두 완료 또는 단수 기사 → 모달 닫기
      setModalState(null)
      setSelectedDriver(null)
    }
  }

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

  /* ── 리뷰 버튼 (정산완료 전용) ── */
  const reviewButton =
    acceptedDrivers.length === 0 ? null :
    allReviewed ? (
      <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg whitespace-nowrap">
        리뷰 완료
      </span>
    ) : (
      <button
        onClick={handleReviewButtonClick}
        className="text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-lg transition-colors active:scale-95 whitespace-nowrap"
      >
        리뷰 남기기
      </button>
    )

  /* ── 카드 본문 ── */
  const cardBody = (
    <div className={`bg-white border border-gray-200 rounded-2xl overflow-hidden flex ${
      !isSettled ? 'hover:border-blue-300 hover:shadow-md transition-all cursor-pointer' : ''
    }`}>
      <div className={`w-1.5 shrink-0 ${STATUS_BAR[effectiveStatus]}`} />

      <div className="flex-1 px-4 py-4 flex items-center gap-4">
        {/* 좌측: 뱃지·제목·위치 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-2">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
              effectiveStatus === 'open' && job.reviewing_count > 0
                ? 'text-blue-700 bg-blue-50'
                : STATUS_BADGE[effectiveStatus]
            }`}>
              {effectiveStatus === 'open' && job.reviewing_count > 0 ? '검토중' : JOB_STATUS_LABELS[effectiveStatus]}
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

        {/* 우측: 날짜·지급일 + 액션 버튼 */}
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
            reviewButton
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

  return (
    <>
      {isSettled ? (
        <div>{cardBody}</div>
      ) : (
        <Link href={showApplicants ? `/manager/jobs/${job.id}/applicants` : `/jobs/${job.id}`} className="block">
          {cardBody}
        </Link>
      )}

      {/* 기사 선택 모달 (2명 이상일 때 1차 진입) */}
      {modalState === 'selecting' && typeof window !== 'undefined' && createPortal(
        <DriverSelectModal
          jobTitle={job.title}
          drivers={acceptedDrivers}
          localReviewed={localReviewed}
          jobId={job.id}
          getEquipmentLabel={getEquipmentLabel}
          onSelect={handleDriverSelect}
          onClose={() => setModalState(null)}
        />,
        document.body
      )}

      {/* 리뷰 작성 모달 */}
      {modalState === 'reviewing' && selectedDriver && (
        <ReviewModal
          jobId={job.id}
          revieweeId={selectedDriver.driver_id}
          revieweeRole="driver"
          onClose={handleReviewModalClose}
          onSuccess={handleReviewSuccess}
        />
      )}
    </>
  )
}

/* ── 기사 선택 모달 (복수 기사 케이스 전용) ── */

interface DriverSelectModalProps {
  jobTitle: string
  drivers: { driver_id: string; applied_equipment_code: string | null }[]
  localReviewed: Set<string>
  jobId: string
  getEquipmentLabel: (driver: { driver_id: string; applied_equipment_code: string | null }, index: number) => string
  onSelect: (driver: { driver_id: string; applied_equipment_code: string | null }) => void
  onClose: () => void
}

function DriverSelectModal({
  jobTitle, drivers, localReviewed, jobId, getEquipmentLabel, onSelect, onClose,
}: DriverSelectModalProps) {
  const pendingCount = drivers.filter((d) => !localReviewed.has(`${jobId}:${d.driver_id}`)).length

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl px-6 pt-5 pb-8 z-10">
        {/* 모바일 핸들 */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5 sm:hidden" />

        {/* 헤더 */}
        <div className="flex items-start justify-between mb-1">
          <div>
            <h2 className="text-base font-bold text-gray-900">리뷰를 남길 기사님을 선택해 주세요</h2>
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{jobTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors shrink-0 ml-3"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {pendingCount > 0 && (
          <p className="text-xs text-blue-500 font-semibold mb-4">
            {pendingCount}명 평가 남음
          </p>
        )}

        {/* 기사 목록 */}
        <div className="flex flex-col gap-2.5 mt-4">
          {drivers.map((driver, i) => {
            const isReviewed = localReviewed.has(`${jobId}:${driver.driver_id}`)
            const label = getEquipmentLabel(driver, i)

            return (
              <button
                key={driver.driver_id}
                onClick={() => !isReviewed && onSelect(driver)}
                disabled={isReviewed}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border text-left transition-all ${
                  isReviewed
                    ? 'bg-gray-50 border-gray-100 cursor-not-allowed'
                    : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50 active:scale-[0.98]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isReviewed ? 'bg-gray-100' : 'bg-blue-50'
                  }`}>
                    <svg className={`w-4 h-4 ${isReviewed ? 'text-gray-300' : 'text-blue-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M4 17l4-8 4 4 4-6" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="4" cy="19" r="2" />
                      <circle cx="20" cy="19" r="2" />
                      <path d="M2 19h2M18 19h2M6 19h12" />
                    </svg>
                  </div>
                  <span className={`text-sm font-bold ${isReviewed ? 'text-gray-400' : 'text-gray-800'}`}>
                    {label} 기사님
                  </span>
                </div>

                {isReviewed ? (
                  <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg shrink-0">
                    평가 완료
                  </span>
                ) : (
                  <svg className="w-4 h-4 text-blue-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
