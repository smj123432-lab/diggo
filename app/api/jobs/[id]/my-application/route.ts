import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/auth'

// GET /api/jobs/[id]/my-application — 현재 로그인 기사의 지원 여부 조회
export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { supabase, user } = await getAuthUser()

  if (!user) return NextResponse.json({ data: null })

  const { data } = await supabase
    .from('applications')
    .select('id, status')
    .eq('job_id', id)
    .eq('driver_id', user.id)
    .maybeSingle()

  return NextResponse.json({ data })
}
