import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, unauthorizedResponse } from '@/lib/api/auth'

// GET /api/applications/accepted?job_ids=id1,id2,...
// 정산완료 일감의 accepted 기사 ID를 반환 (소장 전용 — 리뷰 작성용)
export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const jobIdsParam = searchParams.get('job_ids')
    if (!jobIdsParam) return NextResponse.json({ data: [] })

    const jobIds = jobIdsParam.split(',').filter(Boolean)
    if (jobIds.length === 0) return NextResponse.json({ data: [] })

    // 본인 소유 일감인지 확인
    const { data: jobs } = await supabase
      .from('jobs')
      .select('id')
      .eq('manager_id', user.id)
      .in('id', jobIds)

    const validJobIds = (jobs ?? []).map((j) => j.id)
    if (validJobIds.length === 0) return NextResponse.json({ data: [] })

    const { data } = await supabase
      .from('applications')
      .select('job_id, driver_id')
      .eq('status', 'accepted')
      .in('job_id', validJobIds)

    return NextResponse.json({ data: data ?? [] })
  } catch (error) {
    console.error('[GET /api/applications/accepted]', error)
    return NextResponse.json({ error: '조회에 실패했습니다.' }, { status: 500 })
  }
}
