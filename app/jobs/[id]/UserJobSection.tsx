'use client'

// 일감 상세 — 사용자별 영역 (지원 버튼, 소장 액션, 장비별 배차 현황)
import { useAuthStore } from '@/store/auth'
import { useQuery } from '@tanstack/react-query'
import { JobApplyButton } from '@/components/features/jobs/JobApplyButton'
import { JobOwnerActions } from '@/components/features/jobs/JobOwnerActions'
import { JobStatusBadge } from '@/components/features/jobs/JobStatusBadge'
import { EquipmentDispatchBadges } from '@/components/features/jobs/EquipmentDispatchBadges'
import type { JobStatus, ApplicationStatus, EquipmentCode } from '@/types'

interface JobSnapshot {
  id: string
  manager_id: string
  status: string
  equipment_codes: EquipmentCode[]
}

interface Props {
  job: JobSnapshot
  effectiveStatus: JobStatus
  payDueDate: string
}

export function UserJobSection({ job, effectiveStatus, payDueDate }: Props) {
  const { user, profile, isLoading } = useAuthStore()

  const { data: existingApplication } = useQuery<{ id: string; status: ApplicationStatus } | null>({
    queryKey: ['my-application', job.id, user?.id],
    queryFn: () =>
      fetch(`/api/jobs/${job.id}/my-application`)
        .then((r) => r.json())
        .then((r) => r.data ?? null),
    enabled: !!user && profile?.role === 'driver',
    staleTime: 0,   // 항상 최신값 유지
    retry: 2,
  })

  // 장비별 배차 현황 — 모집중이고 다중 장비일 때만 fetch
  const { data: dispatchedCodes } = useQuery<Record<string, boolean>>({
    queryKey: ['equipment-status', job.id],
    queryFn: () =>
      fetch(`/api/jobs/${job.id}/equipment-status`)
        .then((r) => r.json())
        .then((r) => r.data ?? {}),
    enabled: !!user && effectiveStatus === 'open' && job.equipment_codes.length > 1,
    staleTime: 0,
  })

  if (isLoading) {
    return <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
  }

  const isOwnJob = user?.id === job.manager_id
  const showApplyBar = !isOwnJob && profile?.role !== 'manager'

  return (
    <>
      {/* 장비별 배차 현황 (모집중 + 다중 장비일 때 표시) */}
      {effectiveStatus === 'open' && job.equipment_codes.length > 1 && dispatchedCodes && (
        <div className="mb-3">
          <EquipmentDispatchBadges
            equipmentCodes={job.equipment_codes}
            dispatchedCodes={dispatchedCodes}
          />
        </div>
      )}

      {/* 소장 본인: 상태 드롭다운 배지 + 관리 버튼 */}
      {isOwnJob && (
        <>
          <div className="mb-3">
            <JobStatusBadge jobId={job.id} effectiveStatus={effectiveStatus} />
          </div>
          <JobOwnerActions
            jobId={job.id}
            effectiveStatus={effectiveStatus}
            payDueDate={payDueDate}
          />
        </>
      )}

      {/* 기사: 지원 버튼 (데스크탑 퀵카드 + 모바일 고정 하단) */}
      {showApplyBar && (
        <>
          {/* 데스크탑: 퀵카드 인라인 버튼 */}
          <div className="hidden lg:block">
            <JobApplyButton
              jobId={job.id}
              jobStatus={effectiveStatus}
              userRole={profile?.role ?? null}
              isCertified={profile?.is_certified ?? false}
              bannedUntil={profile?.banned_until ?? null}
              existingApplication={existingApplication ?? null}
              equipmentCodes={job.equipment_codes}
              dispatchedCodes={dispatchedCodes}
            />
          </div>
          {/* 모바일: 하단 고정 바 */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-gray-200 px-4 py-4 z-20">
            <div className="max-w-lg mx-auto">
              <JobApplyButton
                jobId={job.id}
                jobStatus={effectiveStatus}
                userRole={profile?.role ?? null}
                isCertified={profile?.is_certified ?? false}
                bannedUntil={profile?.banned_until ?? null}
                existingApplication={existingApplication ?? null}
                equipmentCodes={job.equipment_codes}
                dispatchedCodes={dispatchedCodes}
              />
            </div>
          </div>
        </>
      )}
    </>
  )
}
