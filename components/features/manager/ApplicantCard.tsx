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
      avatar_url: string | null
      bio: string | null
    }
    equipments: {
      id: string
      model_code: EquipmentCode
      license_number: string | null
    } | null
    driverEquipments: EquipmentCode[]
  }
}

const STATUS_STYLE: Record<ApplicationStatus, string> = {
  pending:   'bg-gray-100 text-gray-600',
  reviewing: 'bg-blue-100 text-blue-700',
  accepted:  'bg-emerald-100 text-emerald-700',
  rejected:  'bg-red-100 text-red-500',
}

export function ApplicantCard({ jobId, application }: ApplicantCardProps) {
  const { profiles: driver, driverEquipments } = application
  const appliedAt = new Date(application.applied_at).toLocaleDateString('ko-KR', {
    month: 'numeric', day: 'numeric',
  })

  return (
    <Link href={`/manager/jobs/${jobId}/applicants/${application.id}`}>
      <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-md transition-all">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>

            {/* 아바타 */}
            <div className="rounded-full overflow-hidden bg-gray-200 flex items-center justify-center shrink-0" style={{ width: 56, height: 56, alignSelf: 'center' }}>
              {driver.avatar_url ? (
                <img src={driver.avatar_url} alt={driver.name} className="w-full h-full object-cover" />
              ) : (
                <svg className="w-7 h-7 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                </svg>
              )}
            </div>

            <div className="min-w-0 flex-1">
              {/* 이름 + 인증 */}
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-sm font-bold text-gray-900">{driver.name}</span>
                {driver.is_certified && (
                  <span className="inline-flex items-center justify-center bg-blue-500 text-white w-4 h-4 rounded-full shrink-0">
                    <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                )}
              </div>

              {/* 평점 · 경력 · 보유 장비 */}
              <div className="flex items-center flex-wrap gap-1.5 text-xs text-gray-400 mb-1.5">
                <span className="flex items-center gap-0.5">
                  <span className="text-yellow-400">★</span>
                  <span>{driver.rating_avg.toFixed(1)}</span>
                </span>
                {driver.experience_years !== null && (
                  <><span className="text-gray-200">·</span><span>경력 {driver.experience_years}년</span></>
                )}
                {driverEquipments.length > 0 && (
                  <>
                    <span className="text-gray-200">·</span>
                    <div className="flex flex-wrap gap-1">
                      {driverEquipments.map((code) => (
                        <span key={code} className="bg-blue-500 text-white font-bold px-1.5 py-0.5 rounded text-xs">
                          {EQUIPMENT_LABELS[code]}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* 자기소개 */}
              {driver.bio && (
                <p className="text-xs text-gray-400 line-clamp-1">&ldquo;{driver.bio}&rdquo;</p>
              )}
            </div>
          </div>

          {/* 우측: 상태 + 날짜 */}
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
