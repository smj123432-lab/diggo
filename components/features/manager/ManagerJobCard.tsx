// 소장 내 일감 카드 — 좌측 컬러 바 + 정보 우측 정렬
import Link from 'next/link'
import type { Job, JobStatus, EquipmentCode } from '@/types'
import { EQUIPMENT_LABELS, JOB_STATUS_LABELS, PAY_DUE_LABELS } from '@/types'

interface ManagerJobCardProps {
  job: Job & { applicant_count: number; pending_count: number }
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
  in_progress: 'text-brand-blue-deep bg-blue-50',
  completed:   'text-emerald-700 bg-emerald-50',
  settled:     'text-emerald-700 bg-emerald-50',
}

export function ManagerJobCard({ job }: ManagerJobCardProps) {
  const workDate = new Date(job.work_date).toLocaleDateString('ko-KR', {
    month: 'numeric', day: 'numeric', weekday: 'short',
  })

  const today = new Date().toISOString().split('T')[0]
  const effectiveStatus: JobStatus =
    job.status === 'open' && job.work_date < today ? 'closed' : job.status

  const showApplicants = effectiveStatus === 'open' || effectiveStatus === 'closed'

  return (
    <Link href={showApplicants ? `/manager/jobs/${job.id}/applicants` : `/jobs/${job.id}`} className="block">
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex hover:border-blue-300 hover:shadow-md transition-all">

        {/* 좌측 컬러 바 */}
        <div className={`w-1.5 shrink-0 ${STATUS_BAR[effectiveStatus]}`} />

        {/* 본문 — 좌측 메타 + 우측 그룹 */}
        <div className="flex-1 px-4 py-4 flex items-center gap-4">

          {/* 좌측: 뱃지·제목·위치 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-2">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${STATUS_BADGE[effectiveStatus]}`}>
                {JOB_STATUS_LABELS[effectiveStatus]}
              </span>
              {(job.equipment_codes as EquipmentCode[]).map((code) => (
                <span key={code} className="bg-brand-blue text-white text-xs font-bold px-2 py-0.5 rounded-md">
                  {EQUIPMENT_LABELS[code]}
                </span>
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

          {/* 우측: 날짜·지급일 + 지원자 버튼 */}
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
            ) : (
              <span className="text-xs text-gray-400 px-4 py-2">
                {effectiveStatus === 'in_progress' && '작업중'}
                {effectiveStatus === 'completed' && '정산 대기중'}
                {effectiveStatus === 'settled' && '정산 완료'}
              </span>
            )}
          </div>

        </div>
      </div>
    </Link>
  )
}
