// 소장 — 지원자 상세 페이지 (기사 프로필 + 수락/거절 액션)
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ApplicantActions } from '@/components/features/manager/ApplicantActions'
import type { ApplicationStatus, EquipmentCode } from '@/types'
import { EQUIPMENT_LABELS, APPLICATION_STATUS_LABELS } from '@/types'

interface Props {
  params: { id: string; applicationId: string }
}

const STATUS_STYLE: Record<ApplicationStatus, string> = {
  pending:   'bg-gray-100 text-gray-600',
  reviewing: 'bg-blue-100 text-blue-700',
  accepted:  'bg-emerald-100 text-emerald-700',
  rejected:  'bg-red-100 text-red-500',
}

export default async function ApplicantDetailPage({ params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) notFound()

  const { data: application, error } = await supabase
    .from('applications')
    .select('id, status, applied_at, driver_id, equipment_id, job_id')
    .eq('id', params.applicationId)
    .single()

  if (error || !application) notFound()

  const [{ data: jobData }, { data: driverData }, { data: equipmentData }] = await Promise.all([
    supabase.from('jobs').select('id, title, manager_id').eq('id', application.job_id).single(),
    supabase.from('profiles').select('id, name, rating_avg, is_certified, experience_years, phone, preferred_equipment_codes, avatar_url, bio').eq('id', application.driver_id).single(),
    application.equipment_id
      ? supabase.from('equipments').select('id, model_code, license_number').eq('id', application.equipment_id).single()
      : Promise.resolve({ data: null }),
  ])

  if (!jobData || jobData.manager_id !== user.id) notFound()

  const job = jobData as { id: string; title: string; manager_id: string }
  const driver = (driverData ?? {}) as {
    id: string; name: string; rating_avg: number; is_certified: boolean
    experience_years: number | null; phone: string | null
    preferred_equipment_codes: EquipmentCode[]
    avatar_url: string | null; bio: string | null
  }
  const equipment = equipmentData as {
    id: string; model_code: EquipmentCode; license_number: string | null
  } | null

  const appliedAt = new Date(application.applied_at).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <main className="min-h-screen bg-gray-50 pb-8">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href={`/manager/jobs/${params.id}/applicants`} className="p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <span className="text-sm font-semibold text-gray-700">지원자 상세</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center shrink-0">
              {driver.avatar_url ? (
                <img src={driver.avatar_url} alt={driver.name} className="w-full h-full object-cover" />
              ) : (
                <svg className="w-8 h-8 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                </svg>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base font-bold text-gray-900">{driver.name}</span>
                {driver.is_certified && (
                  <span className="inline-flex items-center gap-1 bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    인증 기사
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="text-yellow-400">★</span>
                <span>{driver.rating_avg.toFixed(1)}</span>
                {driver.experience_years !== null && (
                  <><span className="text-gray-200">·</span><span>경력 {driver.experience_years}년</span></>
                )}
              </div>
              {driver.bio && (
                <p className="text-xs text-gray-400 mt-1.5">&ldquo;{driver.bio}&rdquo;</p>
              )}
            </div>
          </div>

          {equipment && (
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-400 mb-2">보유 장비</p>
              <div className="flex items-center gap-2">
                <span className="bg-blue-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                  {EQUIPMENT_LABELS[equipment.model_code]}
                </span>
                {equipment.license_number && (
                  <span className="text-xs text-gray-500">{equipment.license_number}</span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-xs text-gray-400 mb-3">지원 정보</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800">{job.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{appliedAt} 지원</p>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${STATUS_STYLE[application.status as ApplicationStatus]}`}>
              {APPLICATION_STATUS_LABELS[application.status as ApplicationStatus]}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-xs text-gray-400 mb-3">지원 처리</p>
          <ApplicantActions
            applicationId={params.applicationId}
            currentStatus={application.status as ApplicationStatus}
            jobId={params.id}
          />
        </div>

      </div>
    </main>
  )
}
