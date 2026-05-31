// 일감 수정 페이지 — 소장 본인만 접근 가능
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { JobForm } from '@/components/features/jobs/JobForm'
import type { EquipmentCode, JobType, PayDueType, WorkDuration } from '@/types'


interface Props {
  params: Promise<{ id: string }>
}

export default async function JobEditPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: job, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !job) notFound()
  if (job.manager_id !== user.id) redirect(`/jobs/${id}`)

  const equipment_codes = (job.equipment_codes as EquipmentCode[]) ?? []
  const pay_amounts = (job.pay_amounts as Record<string, number>) ?? {}
  const work_days_map = (job.work_days as Record<string, number>) ?? {}

  const initialValues = {
    title: job.title as string,
    job_type: job.job_type as JobType,
    equipment_codes,
    description: job.description as string,
    attachments: (job.attachments as string | null) ?? '',
    caution: (job.caution as string | null) ?? '',
    location: job.location as string,
    latitude: job.latitude as number | null,
    longitude: job.longitude as number | null,
    payments: Object.fromEntries(
      equipment_codes.map(code => [
        code,
        {
          amount: (pay_amounts[code] ?? 0).toLocaleString(),
          days: String(work_days_map[code] ?? 0),
        },
      ])
    ) as Partial<Record<EquipmentCode, { amount: string; days: string }>>,
    work_date: job.work_date as string,
    work_duration: (job.work_duration as WorkDuration | null) ?? ('' as const),
    pay_due_type: job.pay_due_type as PayDueType,
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-8">

      {/* 헤더 */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href={`/jobs/${id}`}
            className="p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <span className="text-sm font-semibold text-gray-700">일감 수정</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5">
        <JobForm mode="edit" jobId={id} initialValues={initialValues} />
      </div>

    </main>
  )
}
