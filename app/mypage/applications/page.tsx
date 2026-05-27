// 기사 — 내 지원 현황 페이지
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { ApplicationStatus, EquipmentCode, JobStatus } from '@/types'
import { APPLICATION_STATUS_LABELS, EQUIPMENT_LABELS, JOB_STATUS_LABELS } from '@/types'

export const dynamic = 'force-dynamic'

const APP_STATUS_STYLE: Record<ApplicationStatus, string> = {
  pending:   'bg-gray-100 text-gray-600',
  reviewing: 'bg-blue-100 text-blue-700',
  accepted:  'bg-emerald-100 text-emerald-700',
  rejected:  'bg-red-100 text-red-400',
}

const JOB_STATUS_STYLE: Record<JobStatus, string> = {
  open:        'bg-emerald-100 text-emerald-700',
  closed:      'bg-gray-100 text-gray-500',
  in_progress: 'bg-blue-100 text-blue-700',
  completed:   'bg-purple-100 text-purple-700',
  settled:     'bg-emerald-100 text-emerald-700',
}

export default async function DriverApplicationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'driver') redirect('/jobs')

  const { data: applications } = await supabase
    .from('applications')
    .select(`
      id, status, applied_at,
      jobs(id, title, work_date, status, equipment_codes, location, pay_amounts),
      equipments(id, model_code)
    `)
    .eq('driver_id', user.id)
    .order('applied_at', { ascending: false })

  const today = new Date().toISOString().split('T')[0]

  return (
    <main className="min-h-screen bg-gray-50">

      {/* 헤더 */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/mypage" className="p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <span className="text-sm font-semibold text-gray-700">내 지원 현황</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-5">

        <p className="text-sm font-semibold text-gray-700 mb-4">
          총 {(applications ?? []).length}건
        </p>

        {(applications ?? []).length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-sm mb-4">아직 지원한 일감이 없습니다.</p>
            <Link
              href="/jobs"
              className="inline-block bg-blue-500 text-white font-bold px-6 py-3 rounded-2xl text-sm hover:bg-blue-600 transition-colors"
            >
              일감 찾아보기
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {(applications ?? []).map((app) => {
              const job = app.jobs as unknown as {
                id: string; title: string; work_date: string
                status: JobStatus; equipment_codes: EquipmentCode[]
                location: string; pay_amounts: Record<string, number>
              } | null
              const equipment = app.equipments as unknown as { id: string; model_code: EquipmentCode } | null

              if (!job) return null

              const effectiveJobStatus: JobStatus =
                job.status === 'open' && job.work_date < today ? 'closed' : job.status

              const workDate = new Date(job.work_date).toLocaleDateString('ko-KR', {
                month: 'numeric', day: 'numeric', weekday: 'short',
              })

              const payValues = Object.values(job.pay_amounts)
              const payMin = Math.min(...payValues)
              const payMax = Math.max(...payValues)
              const payText = payMin === payMax
                ? `${payMin.toLocaleString()}원`
                : `${payMin.toLocaleString()}~${payMax.toLocaleString()}원`

              return (
                <Link key={app.id} href={`/jobs/${job.id}`}>
                  <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-md transition-all">

                    {/* 상단 뱃지 */}
                    <div className="flex items-center gap-1.5 flex-wrap mb-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${APP_STATUS_STYLE[app.status as ApplicationStatus]}`}>
                        {APPLICATION_STATUS_LABELS[app.status as ApplicationStatus]}
                      </span>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${JOB_STATUS_STYLE[effectiveJobStatus]}`}>
                        {JOB_STATUS_LABELS[effectiveJobStatus]}
                      </span>
                      {equipment && (
                        <span className="bg-blue-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                          {EQUIPMENT_LABELS[equipment.model_code]}
                        </span>
                      )}
                      <span className="ml-auto text-xs text-gray-400">{workDate}</span>
                    </div>

                    {/* 제목 */}
                    <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2">{job.title}</h3>

                    {/* 위치 + 금액 */}
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        {job.location}
                      </span>
                      <span className="font-semibold text-gray-700">{payText}</span>
                    </div>

                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
