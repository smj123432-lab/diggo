import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, unauthorizedResponse } from '@/lib/api/auth'

// GET /api/jobs/[id]/applications — 특정 일감의 지원자 목록 (소장 전용)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const { supabase, user } = await getAuthUser()

    if (!user) {
      return unauthorizedResponse()
    }

    const { data: job } = await supabase
      .from('jobs')
      .select('manager_id')
      .eq('id', id)
      .single()

    if (!job) {
      return NextResponse.json({ error: '일감을 찾을 수 없습니다.' }, { status: 404 })
    }
    if (job.manager_id !== user.id) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('applications')
      .select(`
        id, status, applied_at, equipment_id,
        profiles(id, name, rating_avg, is_certified, experience_years),
        equipments(id, model_code, license_number)
      `)
      .eq('job_id', id)
      .order('applied_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[GET /api/jobs/[id]/applications]', error)
    return NextResponse.json({ error: '지원자 목록을 불러오지 못했습니다.' }, { status: 500 })
  }
}
