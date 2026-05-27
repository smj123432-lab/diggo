// 지원자 카드 컴포넌트
import Link from 'next/link'
import type { ApplicationStatus, EquipmentCode } from '@/types'
import { APPLICATION_STATUS_LABELS, EQUIPMENT_LABELS } from '@/types'

interface ApplicantCardProps {
  jobId: string
  application: {
    id: string
    status: ApplicationStatus
    applied_at: string
    profiles: {
      id: string
      name: string
      rating_avg: number
      is_certified: boolean
      experience_years: number | null
    }
    equipments: {
      id: string
      model_code: EquipmentCode
      license_number: string | null
    } | null
  }
}

const STATUS_STYLE: Record<ApplicationStatus, string> = {
  pending:   'bg-gray-100 text-gray-600',
  reviewing: 'bg-blue-100 text-blue-700',
  accepted:  'bg-emerald-100 text-emerald-700',
  rejected:  'bg-red-100 text-red-500',
}

export function ApplicantCard({ jobId, application }: ApplicantCardProps) {
  const { profiles: driver, equipments: equipment } = application
  const appliedAt = new Date(application.applied_at).toLocaleDateString('ko-KR', {
    month: 'numeric', day: 'numeric',
  })

  return (
    <Link href={`/manager/jobs/${jobId}/applicants/${application.id}`}>
      <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-md transition-all">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm shrink-0">
              {driver.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-sm font-bold text-gray-900">{driver.name}</span>
                {driver.is_certified && (
                  <span className="inline-flex items-center justify-center bg-blue-500 text-white w-4 h-4 rounded-full shrink-0">
                    <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className="text-yellow-400">★</span>
                <span>{driver.rating_avg.toFixed(1)}</span>
                {driver.experience_years !== null && (
                  <><span className="text-gray-200">·</span><span>경력 {driver.experience_years}년</span></>
                )}
                {equipment && (
                  <><span className="text-gray-200">·</span>
                  <span className="bg-blue-500 text-white font-bold px-1.5 py-0.5 rounded text-xs">
                    {EQUIPMENT_LABELS[equipment.model_code]}
                  </span></>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${STATUS_STYLE[application.status]}`}>
              {APPLICATION_STATUS_LABELS[application.status]}
            </span>
            <span className="text-xs text-gray-400">{appliedAt} 지원</span>
            <span className="text-xs font-semibold text-blue-500">상세 보기 →</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
