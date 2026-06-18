// 소장 — 특정 일감의 지원자 목록 페이지
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ApplicantCard } from '@/components/features/manager/ApplicantCard'
import type { ApplicationStatus, JobStatus, EquipmentCode } from '@/types'
import { EQUIPMENT_LABELS, JOB_STATUS_LABELS } from '@/types'
import { formatLongDate, getServerTodayStr } from '@/lib/utils/date'

interface MappedApplication {
  id: string
  status: ApplicationStatus
  applied_at: string
  applied_equipment_code: string | null
  profiles: {
    id: string; name: string; rating_avg: number; review_count: number
    is_certified: boolean; experience_years: number | null
    avatar_url: string | null; bio: string | null; penalty_count: number
  } | null
  equipments: { id: string; model_code: EquipmentCode; license_number: string | null } | null
  driverEquipments: EquipmentCode[]
}

interface Props {
  params: Promise<{ id: string }>
}

const JOB_STATUS_STYLE: Record<JobStatus, string> = {
  open:        'bg-emerald-100 text-emerald-700',
  closed:      'bg-gray-100 text-gray-500',
  in_progress: 'bg-blue-100 text-blue-700',
  completed:   'bg-slate-100 text-slate-600',
  settled:     'bg-emerald-100 text-emerald-700',
}

export default async function ApplicantsPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) notFound()

  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('id, title, work_date, status, equipment_codes, location')
    .eq('id', id)
    .eq('manager_id', user.id)
    .single()

  if (jobError || !job) notFound()

  const { data: rawApps } = await supabase
    .from('applications')
    .select('id, status, applied_at, driver_id, equipment_id, applied_equipment_code')
    .eq('job_id', id)
    .order('applied_at', { ascending: false })

  const driverIds = (rawApps ?? []).map((a) => a.driver_id).filter(Boolean)
  const equipmentIds = (rawApps ?? []).map((a) => a.equipment_id).filter(Boolean)

  const [{ data: profiles }, { data: equipments }, { data: driverEquipments }] = await Promise.all([
    driverIds.length > 0
      ? supabase.from('profiles').select('id, name, rating_avg, review_count, is_certified, experience_years, avatar_url, bio, penalty_count').in('id', driverIds)
      : Promise.resolve({ data: [] }),
    equipmentIds.length > 0
      ? supabase.from('equipments').select('id, model_code, license_number').in('id', equipmentIds)
      : Promise.resolve({ data: [] }),
    driverIds.length > 0
      ? supabase.from('equipments').select('id, owner_id, model_code').in('owner_id', driverIds)
      : Promise.resolve({ data: [] }),
  ])

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))
  const equipmentMap = new Map((equipments ?? []).map((e) => [e.id, e]))
  const driverEquipmentMap = new Map<string, EquipmentCode[]>()
  for (const eq of (driverEquipments ?? [])) {
    const list = driverEquipmentMap.get(eq.owner_id) ?? []
    list.push(eq.model_code as EquipmentCode)
    driverEquipmentMap.set(eq.owner_id, list)
  }

  const applications: MappedApplication[] = (rawApps ?? []).map((app) => ({
    ...app,
    profiles: profileMap.get(app.driver_id) ?? null,
    equipments: app.equipment_id ? (equipmentMap.get(app.equipment_id) ?? null) : null,
    driverEquipments: driverEquipmentMap.get(app.driver_id) ?? [],
    applied_equipment_code: (app.applied_equipment_code as string | null) ?? null,
  }))

  const workDate = formatLongDate(job.work_date)

  const today = getServerTodayStr()
  const effectiveStatus: JobStatus =
    job.status === 'open' && job.work_date < today ? 'closed' : job.status as JobStatus

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/manager/jobs" className="p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <span className="flex-1 text-sm font-semibold text-gray-700">지원자 목록</span>
          <Link href="/chats" className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-blue-500" title="채팅">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-5">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${JOB_STATUS_STYLE[effectiveStatus]}`}>
              {JOB_STATUS_LABELS[effectiveStatus]}
            </span>
            {(job.equipment_codes as EquipmentCode[]).map((code) => (
              <span key={code} className="bg-blue-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                {EQUIPMENT_LABELS[code]}
              </span>
            ))}
          </div>
          <h1 className="text-base font-bold text-gray-900 mb-1">{job.title}</h1>
          <p className="text-xs text-gray-400">{workDate} · {job.location}</p>
        </div>

        <p className="text-sm font-semibold text-gray-700 mb-3">
          지원자 {(applications ?? []).length}명
        </p>

        {(applications ?? []).length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm">아직 지원자가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.filter((app) => app.profiles !== null).map((app) => (
              <ApplicantCard
                key={app.id}
                jobId={id}
                application={app as MappedApplication & { profiles: NonNullable<MappedApplication['profiles']> }}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
