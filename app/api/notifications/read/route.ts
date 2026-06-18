import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, unauthorizedResponse } from '@/lib/api/auth'

// PATCH /api/notifications/read — 알림 읽음 처리
export async function PATCH(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthUser()

    if (!user) {
      return unauthorizedResponse()
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
