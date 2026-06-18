// 기사 — 내 지원 현황 페이지
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { DriverApplicationsList } from '@/components/features/driver/DriverApplicationsList'
import type { DriverApplication } from '@/components/features/driver/DriverApplicationsList'
import type { EquipmentCode } from '@/types'
import { AppNav } from '@/components/features/home/AppNav'

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

  // 지원 목록 (별도 쿼리로 embedded select RLS 우회)
  const { data: rawApps } = await supabase
    .from('applications')
    .select('id, status, applied_at, job_id, equipment_id, applied_equipment_code')
    .eq('driver_id', user.id)
    .order('applied_at', { ascending: false })

  const jobIds = (rawApps ?? []).map((a) => a.job_id).filter((id): id is string => id !== null && id !== undefined)
  const equipmentIds = (rawApps ?? []).map((a) => a.equipment_id).filter((id): id is string => id !== null && id !== undefined)

  const [{ data: jobs }, { data: equipments }, { data: givenReviews }] = await Promise.all([
    jobIds.length > 0
      ? supabase
          .from('jobs')
          .select('id, title, work_date, status, equipment_codes, location, pay_amounts, manager_id')
          .in('id', jobIds)
      : Promise.resolve({ data: [] }),
    equipmentIds.length > 0
      ? supabase
          .from('equipments')
          .select('id, model_code')
          .in('id', equipmentIds)
      : Promise.resolve({ data: [] }),
    supabase
      .from('reviews')
      .select('job_id')
      .eq('reviewer_id', user.id),
  ])

  const jobMap = new Map((jobs ?? []).map((j) => [j.id, j]))
  const equipmentMap = new Map((equipments ?? []).map((e) => [e.id, e]))
  const reviewedJobIds = new Set((givenReviews ?? []).map((r) => r.job_id))

  const applications: DriverApplication[] = (rawApps ?? [])
    .map((app) => {
      const job = jobMap.get(app.job_id)
      if (!job) return null
      return {
        id: app.id,
        status: app.status,
        applied_at: app.applied_at,
        hasReview: reviewedJobIds.has(app.job_id),
        applied_equipment_code: (app.applied_equipment_code as string | null) ?? null,
        job: job as DriverApplication['job'],
        equipment: app.equipment_id
          ? (equipmentMap.get(app.equipment_id) as { id: string; model_code: EquipmentCode } | null) ?? null
          : null,
      }
    })
    .filter((a): a is DriverApplication => a !== null)

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNav activeLink="role" />

      <div className="pt-16">
        <div className="max-w-3xl mx-auto px-4 py-5">
          <Suspense>
            <DriverApplicationsList applications={applications} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
