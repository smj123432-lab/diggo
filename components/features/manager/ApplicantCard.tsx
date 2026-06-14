'use client'

// 지원자 카드 컴포넌트 — 클릭 시 상세 이동, 프로필 보기 링크 별도 제공
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { ApplicationStatus, EquipmentCode } from '@/types'
import { APPLICATION_STATUS_LABELS } from '@/types'
import { formatMonthDay } from '@/lib/utils/date'
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
      review_count: number
      is_certified: boolean
      experience_years: number | null
      avatar_url: string | null
      bio: string | null
      penalty_count: number
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
  pending:                'bg-gray-100 text-gray-600',
  reviewing:              'bg-blue-100 text-blue-700',
  accepted:               'bg-emerald-100 text-emerald-700',
  rejected:               'bg-red-100 text-red-500',
  cancelled_by_driver:    'bg-orange-100 text-orange-600',
  cancelled_by_manager:   'bg-orange-100 text-orange-600',
}

export function ApplicantCard({ jobId, application }: ApplicantCardProps) {
  const router = useRouter()
  const { profiles: driver, driverEquipments, applied_equipment_code } = application
  const appliedAt = formatMonthDay(application.applied_at)
  const hasPenalty = (driver.penalty_count ?? 0) > 0

  return (
    <div
      className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
      onClick={() => router.push(`/manager/jobs/${jobId}/applicants/${application.id}`)}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>

          <Avatar src={driver.avatar_url} name={driver.name} size="md" />

          <div className="min-w-0 flex-1">
            {/* 이름 + 인증 + 패널티 */}
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span className="text-sm font-bold text-gray-900">{driver.name}</span>
              {driver.review_count >= 5 && driver.rating_avg >= 4.5 && <CertBadge variant="top" />}
              {driver.review_count >= 5 && driver.rating_avg <= 2.0 && <CertBadge variant="low" />}
              {hasPenalty && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 border border-orange-200">
                  패널티 {driver.penalty_count}회
                </span>
              )}
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

        {/* 우측: 상태 + 날짜 + 링크 */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${STATUS_STYLE[application.status]}`}>
            {APPLICATION_STATUS_LABELS[application.status]}
          </span>
          <span className="text-xs text-gray-400">{appliedAt} 지원</span>
          <span className="text-xs font-semibold text-blue-500">상세 보기 →</span>
          {/* 외부 link는 e.stopPropagation()으로 카드 클릭 이벤트 차단 */}
          <Link
            href={`/profiles/${driver.id}`}
            className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            프로필 →
          </Link>
        </div>
      </div>
    </div>
  )
}
