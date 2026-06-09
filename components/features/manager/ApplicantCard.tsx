// 지원자 카드 컴포넌트
import Link from 'next/link'
import type { ApplicationStatus, EquipmentCode } from '@/types'
import { APPLICATION_STATUS_LABELS } from '@/types'
import { Avatar } from '@/components/ui/Avatar'
import { CertBadge } from '@/components/ui/CertBadge'
import { EquipmentBadge } from '@/components/ui/EquipmentBadge'
import { RatingDisplay } from '@/components/ui/RatingDisplay'

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
    applied_equipment_code?: string | null
  }
}

const STATUS_STYLE: Record<ApplicationStatus, string> = {
  pending:   'bg-gray-100 text-gray-600',
  reviewing: 'bg-blue-100 text-blue-700',
  accepted:  'bg-emerald-100 text-emerald-700',
  rejected:  'bg-red-100 text-red-500',
}

export function ApplicantCard({ jobId, application }: ApplicantCardProps) {
  const { profiles: driver, driverEquipments, applied_equipment_code } = application
  const appliedAt = new Date(application.applied_at).toLocaleDateString('ko-KR', {
    month: 'numeric', day: 'numeric',
  })

  return (
    <Link href={`/manager/jobs/${jobId}/applicants/${application.id}`}>
      <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-md transition-all">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>

            <Avatar src={driver.avatar_url} name={driver.name} size="md" />

            <div className="min-w-0 flex-1">
              {/* 이름 + 인증 */}
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-sm font-bold text-gray-900">{driver.name}</span>
                {driver.is_certified && <CertBadge />}
              </div>

              {/* 지원 장비 코드 강조 표시 */}
              {applied_equipment_code && (
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-xs text-gray-400">지원 장비:</span>
                  <EquipmentBadge code={applied_equipment_code as EquipmentCode} size="sm" />
                </div>
              )}

              {/* 평점 · 경력 · 보유 장비 */}
              <div className="flex items-center flex-wrap gap-1.5 text-xs text-gray-400 mb-1.5">
                <RatingDisplay value={driver.rating_avg} />
                {driver.experience_years !== null && (
                  <><span className="text-gray-200">·</span><span>경력 {driver.experience_years}년</span></>
                )}
                {driverEquipments.length > 0 && (
                  <>
                    <span className="text-gray-200">·</span>
                    <div className="flex flex-wrap gap-1">
                      {driverEquipments.map((code) => (
                        <EquipmentBadge key={code} code={code} size="sm" />
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
