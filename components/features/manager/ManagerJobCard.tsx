// 소장 내 일감 카드 — 상태 뱃지, 지원자 수, 작업일 표시
import Link from 'next/link'
import type { Job, JobStatus, EquipmentCode } from '@/types'
import { EQUIPMENT_LABELS, JOB_STATUS_LABELS, PAY_DUE_LABELS } from '@/types'

interface ManagerJobCardProps {
  job: Job & { applicant_count: number; pending_count: number }
}

const STATUS_STYLE: Record<JobStatus, string> = {
  open:        'bg-emerald-100 text-emerald-700',
  closed:      'bg-gray-100 text-gray-500',
  in_progress: 'bg-blue-100 text-blue-700',
  completed:   'bg-purple-100 text-purple-700',
  settled:     'bg-emerald-100 text-emerald-700',
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
    <Link href={showApplicants ? `/manager/jobs/${job.id}/applicants` : `/jobs/${job.id}`}>
      <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-md transition-all">

        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${STATUS_STYLE[effectiveStatus]}`}>
            {JOB_STATUS_LABELS[effectiveStatus]}
          </span>
          {(job.equipment_codes as EquipmentCode[]).map((code) => (
            <span key={code} className="bg-blue-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
              {EQUIPMENT_LABELS[code]}
            </span>
          ))}
          <span className="ml-auto text-xs text-gray-400">{workDate}</span>
        </div>

        <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2">{job.title}</h3>

        <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
          <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {job.location}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">{PAY_DUE_LABELS[job.pay_due_type]}</span>
          {showApplicants ? (
            <div className="flex items-center gap-1.5">
              {job.pending_count > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  NEW {job.pending_count}
                </span>
              )}
              <span className="text-xs text-gray-500">지원자 {job.applicant_count}명 →</span>
            </div>
          ) : (
            <span className="text-xs text-gray-400">
              {effectiveStatus === 'in_progress' && '작업중'}
              {effectiveStatus === 'completed' && '정산 대기중'}
              {effectiveStatus === 'settled' && '정산 완료'}
            </span>
          )}
        </div>

      </div>
    </Link>
  )
}
