import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PATCH /api/auth/password — 비밀번호 변경 (현재 비밀번호 검증 후 변경)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || !user.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: '필수 항목을 입력해주세요.' }, { status: 400 })
    }

    // 현재 비밀번호 검증: 같은 이메일로 로그인 시도
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })

    if (signInError) {
      return NextResponse.json({ error: '현재 비밀번호가 올바르지 않습니다.' }, { status: 400 })
    }

    // 새 비밀번호로 변경
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (updateError) throw updateError

    return NextResponse.json({ message: '비밀번호가 변경되었습니다.' })
  } catch (error) {
    console.error('[PATCH /api/auth/password]', error)
    return NextResponse.json({ error: '비밀번호 변경에 실패했습니다.' }, { status: 500 })
  }
}
