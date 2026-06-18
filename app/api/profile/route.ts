import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, unauthorizedResponse } from '@/lib/api/auth'

// GET /api/profile — 내 프로필 조회
export async function GET() {
  try {
    const { supabase, user } = await getAuthUser()

    if (!user) {
      return unauthorizedResponse()
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
    const { supabase, user } = await getAuthUser()

    if (!user) {
      return unauthorizedResponse()
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

    let { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single()

    // bio 컬럼이 DB에 없는 경우 bio 제외 후 재시도
    // (영구 해결: ALTER TABLE profiles ADD COLUMN bio TEXT;)
    if (error?.message?.includes('bio')) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { bio: _bio, ...updateWithoutBio } = updateData as Record<string, unknown>
      const retry = await supabase
        .from('profiles')
        .update(updateWithoutBio)
        .eq('id', user.id)
        .select()
        .single()
      data = retry.data
      error = retry.error
    }

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[PATCH /api/profile]', JSON.stringify(error))
    const msg =
      (error as { message?: string })?.message ??
      (error as { error?: string })?.error ??
      '프로필 수정에 실패했습니다.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
