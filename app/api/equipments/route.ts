import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { EquipmentCode } from '@/types'

// PUT /api/equipments — 보유 장비 목록 전체 교체
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

    const { codes } = await request.json() as { codes: EquipmentCode[] }

    const { error: delErr } = await supabase
      .from('equipments')
      .delete()
      .eq('owner_id', user.id)
    if (delErr) throw delErr

    if (codes.length > 0) {
      const { error: insErr } = await supabase
        .from('equipments')
        .insert(codes.map((model_code) => ({ owner_id: user.id, model_code })))
      if (insErr) throw insErr
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[PUT /api/equipments]', e)
    return NextResponse.json({ error: '장비 저장에 실패했습니다.' }, { status: 500 })
  }
}
