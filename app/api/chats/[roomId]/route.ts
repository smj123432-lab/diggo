import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/chats/[roomId] — 채팅방 상세 (참여자만)
export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

    const { roomId } = await params

    const { data, error } = await supabase
      .from('chat_rooms')
      .select(`
        id, job_id, manager_id, driver_id, created_at,
        jobs:job_id ( id, title, work_date, equipment_codes ),
        manager:manager_id ( id, name, avatar_url ),
        driver:driver_id ( id, name, avatar_url )
      `)
      .eq('id', roomId)
      .maybeSingle()

    if (error) throw error
    if (!data) return NextResponse.json({ error: '채팅방을 찾을 수 없습니다.' }, { status: 404 })

    // 참여자 검증
    if (data.manager_id !== user.id && data.driver_id !== user.id) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[GET /api/chats/[roomId]]', error)
    return NextResponse.json({ error: '채팅방 정보를 불러오지 못했습니다.' }, { status: 500 })
  }
}
