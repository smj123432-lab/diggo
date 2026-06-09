import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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

    const dispatched = await getJobEquipmentDispatchStatus(
      supabase,
      id,
      job.equipment_codes as string[]
    )

    return NextResponse.json({ data: dispatched })
  } catch (error) {
    console.error('[GET /api/jobs/[id]/equipment-status]', error)
    return NextResponse.json({ error: '배차 현황을 불러오지 못했습니다.' }, { status: 500 })
  }
}
