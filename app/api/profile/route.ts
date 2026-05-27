import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/profile — 내 프로필 조회
export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[GET /api/profile]', error)
    return NextResponse.json({ error: '프로필을 불러오지 못했습니다.' }, { status: 500 })
  }
}

// PATCH /api/profile — 프로필 수정
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const body = await request.json()

    // 허용 필드만 명시적으로 추출 (mass assignment 방지)
    const {
      name, phone, bio, experience_years, garage_address,
      latitude, longitude, preferred_job_types,
      preferred_equipment_codes, preferred_regions,
    } = body

    const updateData = {
      ...(name !== undefined && { name }),
      ...(phone !== undefined && { phone }),
      ...(bio !== undefined && { bio }),
      ...(experience_years !== undefined && { experience_years }),
      ...(garage_address !== undefined && { garage_address }),
      ...(latitude !== undefined && { latitude }),
      ...(longitude !== undefined && { longitude }),
      ...(preferred_job_types !== undefined && { preferred_job_types }),
      ...(preferred_equipment_codes !== undefined && { preferred_equipment_codes }),
      ...(preferred_regions !== undefined && { preferred_regions }),
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[PATCH /api/profile]', error)
    const msg = error instanceof Error ? error.message : '프로필 수정에 실패했습니다.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
