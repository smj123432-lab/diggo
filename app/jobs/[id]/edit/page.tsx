// 일감 수정 페이지 — 소장 본인만 접근 가능
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { JobForm } from '@/components/features/jobs/JobForm'
import type { EquipmentCode, JobType, PayDueType, WorkDuration } from '@/types'

interface Props {
  params: { id: string }
}

export default async function JobEditPage({ params }: Props) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: job, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !job) notFound()
  if (job.manager_id !== user.id) redirect(`/jobs/${params.id}`)

  const initialValues = {
    title: job.title as string,
    job_type: job.job_type as JobType,
    equipment_code: job.equipment_code as EquipmentCode,
    description: job.description as string,
    attachments: (job.attachments as string | null) ?? '',
    caution: (job.caution as string | null) ?? '',
    location: job.location as string,
    latitude: job.latitude as number | null,
    longitude: job.longitude as number | null,
    pay_amount: (job.pay_amount as number).toLocaleString(),
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
            href={`/jobs/${params.id}`}
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
        <JobForm mode="edit" jobId={params.id} initialValues={initialValues} />
      </div>

    </main>
  )
}
