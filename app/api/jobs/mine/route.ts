import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/jobs/mine — 소장의 내 등록 일감 목록 (지원자 수 포함)
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    // 1단계: 일감 목록 조회
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('manager_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    const jobIds = (data ?? []).map((j) => j.id)

    // 2단계: 지원자 수 + 배차된 기사 ID 별도 조회
    let appData: { id: string; job_id: string; status: string; driver_id: string }[] = []
    if (jobIds.length > 0) {
      const { data: apps, error: appError } = await supabase
        .from('applications')
        .select('id, job_id, status, driver_id')
        .in('job_id', jobIds)
      if (appError) {
        console.error('[GET /api/jobs/mine] applications error:', JSON.stringify(appError))
      } else {
        appData = apps ?? []
      }
    }

    const appMap = new Map<string, { id: string; status: string; driver_id: string }[]>()
    for (const app of appData) {
      const list = appMap.get(app.job_id) ?? []
      list.push(app)
      appMap.set(app.job_id, list)
    }

    const jobs = (data ?? []).map((job) => {
      const applications = appMap.get(job.id) ?? []
      const acceptedApp = applications.find((a) => a.status === 'accepted')
      return {
        ...job,
        applicant_count: applications.length,
        pending_count: applications.filter((a) => a.status === 'pending').length,
        accepted_driver_id: acceptedApp?.driver_id ?? null,
      }
    })

    return NextResponse.json({ data: jobs })
  } catch (error) {
    console.error('[GET /api/jobs/mine]', error)
    return NextResponse.json({ error: '일감 목록을 불러오지 못했습니다.' }, { status: 500 })
  }
}
