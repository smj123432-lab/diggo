import { NextResponse } from 'next/server'
import { getAuthUser, unauthorizedResponse } from '@/lib/api/auth'

// GET /api/jobs/mine — 소장의 내 등록 일감 목록 (지원자 수 포함)
export async function GET() {
  try {
    const { supabase, user } = await getAuthUser()

    if (!user) {
      return unauthorizedResponse()
    }

    // 1단계: 일감 목록 조회
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('manager_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    const jobIds = (data ?? []).map((j) => j.id)

    // 2단계: 지원자 수 + 배차된 기사 목록 별도 조회
    let appData: { id: string; job_id: string; status: string; driver_id: string; applied_equipment_code: string | null }[] = []
    if (jobIds.length > 0) {
      const { data: apps, error: appError } = await supabase
        .from('applications')
        .select('id, job_id, status, driver_id, applied_equipment_code')
        .in('job_id', jobIds)
      if (appError) {
        console.error('[GET /api/jobs/mine] applications error:', JSON.stringify(appError))
      } else {
        appData = apps ?? []
      }
    }

    const appMap = new Map<string, { id: string; status: string; driver_id: string; applied_equipment_code: string | null }[]>()
    for (const app of appData) {
      const list = appMap.get(app.job_id) ?? []
      list.push(app)
      appMap.set(app.job_id, list)
    }

    const jobs = (data ?? []).map((job) => {
      const applications = appMap.get(job.id) ?? []
      const acceptedApps = applications.filter((a) => a.status === 'accepted')

      // 동일 기사 중복 제거
      const seen = new Set<string>()
      const accepted_drivers = acceptedApps
        .filter((a) => { if (seen.has(a.driver_id)) return false; seen.add(a.driver_id); return true })
        .map((a) => ({ driver_id: a.driver_id, applied_equipment_code: a.applied_equipment_code ?? null }))

      return {
        ...job,
        applicant_count: applications.length,
        pending_count: applications.filter((a) => a.status === 'pending').length,
        reviewing_count: applications.filter((a) => a.status === 'reviewing').length,
        accepted_drivers,
      }
    })

    return NextResponse.json({ data: jobs })
  } catch (error) {
    console.error('[GET /api/jobs/mine]', error)
    return NextResponse.json({ error: '일감 목록을 불러오지 못했습니다.' }, { status: 500 })
  }
}
