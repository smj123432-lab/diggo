import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/jobs/[id]/accepted-drivers — 이 일감에서 수락된 기사 목록 (소장 전용)
export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

    const { data: job } = await supabase
      .from('jobs')
      .select('manager_id')
      .eq('id', id)
      .single()

    if (!job) return NextResponse.json({ error: '일감을 찾을 수 없습니다.' }, { status: 404 })
    if (job.manager_id !== user.id) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

    const { data: applications } = await supabase
      .from('applications')
      .select('id, driver_id, applied_equipment_code, profiles(id, name, avatar_url)')
      .eq('job_id', id)
      .eq('status', 'accepted')

    // 동일 기사 중복 제거 (여러 장비로 수락된 경우)
    const seen = new Set<string>()
    const unique = (applications ?? []).filter((a) => {
      if (seen.has(a.driver_id)) return false
      seen.add(a.driver_id)
      return true
    })

    return NextResponse.json({ data: unique })
  } catch (error) {
    console.error('[GET /api/jobs/[id]/accepted-drivers]', error)
    return NextResponse.json({ error: '조회에 실패했습니다.' }, { status: 500 })
  }
}
