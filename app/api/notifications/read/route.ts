import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PATCH /api/notifications/read — 알림 읽음 처리
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { ids } = await request.json()

    let query = supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)

    if (ids && Array.isArray(ids)) {
      query = query.in('id', ids)
    }

    const { error } = await query

    if (error) throw error

    return NextResponse.json({ message: '읽음 처리되었습니다.' })
  } catch (error) {
    console.error('[PATCH /api/notifications/read]', error)
    return NextResponse.json({ error: '읽음 처리에 실패했습니다.' }, { status: 500 })
  }
}
