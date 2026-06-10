import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getJobEquipmentDispatchStatus } from '@/lib/utils/dispatch'

// GET /api/jobs/[id]/equipment-status — 장비별 배차 현황 (공개)
export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = await createClient()

    const { data: job } = await supabase
      .from('jobs')
      .select('equipment_codes')
      .eq('id', id)
      .single()

    if (!job) return NextResponse.json({ error: '일감을 찾을 수 없습니다.' }, { status: 404 })

    // applications 테이블은 RLS로 본인 기록만 조회 가능하므로
    // 배차 현황(비민감) 조회에는 service role 클라이언트 사용
    const adminClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const dispatched = await getJobEquipmentDispatchStatus(
      adminClient,
      id,
      job.equipment_codes as string[]
    )

    return NextResponse.json({ data: dispatched })
  } catch (error) {
    console.error('[GET /api/jobs/[id]/equipment-status]', error)
    return NextResponse.json({ error: '배차 현황을 불러오지 못했습니다.' }, { status: 500 })
  }
}
