import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/jobs/[id]/accepted-driver — 배차된 기사 user ID 반환 (소장 리뷰 작성용)
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

    // 본인 소유 일감인지 확인
    const { data: job } = await supabase
      .from('jobs')
      .select('id, manager_id')
      .eq('id', params.id)
      .eq('manager_id', user.id)
      .single()

    if (!job) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

    const { data: application } = await supabase
      .from('applications')
      .select('driver_id')
      .eq('job_id', params.id)
      .eq('status', 'accepted')
      .single()

    return NextResponse.json({ driver_id: application?.driver_id ?? null })
  } catch (error) {
    console.error('[GET /api/jobs/[id]/accepted-driver]', error)
    return NextResponse.json({ error: '조회에 실패했습니다.' }, { status: 500 })
  }
}
