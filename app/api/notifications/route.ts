import { NextResponse } from 'next/server'
import { getAuthUser, unauthorizedResponse } from '@/lib/api/auth'

// GET /api/notifications — 내 알림 목록
export async function GET() {
  try {
    const { supabase, user } = await getAuthUser()

    if (!user) {
      return unauthorizedResponse()
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error

    return NextResponse.json({ data }, {
      headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' },
    })
  } catch (error) {
    console.error('[GET /api/notifications]', error)
    return NextResponse.json({ error: '알림을 불러오지 못했습니다.' }, { status: 500 })
  }
}
