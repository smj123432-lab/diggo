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

    // 변경 불가 필드 제거
    const IMMUTABLE = ['id', 'role', 'rating_avg', 'is_certified']
    const updateData = Object.fromEntries(
      Object.entries(body).filter(([key]) => !IMMUTABLE.includes(key))
    )

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
    return NextResponse.json({ error: '프로필 수정에 실패했습니다.' }, { status: 500 })
  }
}
