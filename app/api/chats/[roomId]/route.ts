import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, unauthorizedResponse } from '@/lib/api/auth'

// GET /api/chats/[roomId] — 채팅방 상세 (참여자만)
export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { supabase, user } = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const { roomId } = await params

    const { data: room } = await supabase
      .from('chat_rooms')
      .select('id, job_id, manager_id, driver_id, created_at')
      .eq('id', roomId)
      .maybeSingle()

    if (!room) return NextResponse.json({ error: '채팅방을 찾을 수 없습니다.' }, { status: 404 })

    if (room.manager_id !== user.id && room.driver_id !== user.id) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 })
    }

    const [{ data: job }, { data: profiles }] = await Promise.all([
      supabase.from('jobs').select('id, title, work_date, equipment_codes').eq('id', room.job_id).maybeSingle(),
      supabase.from('profiles').select('id, name, avatar_url').in('id', [room.manager_id, room.driver_id]),
    ])

    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))

    return NextResponse.json({
      data: {
        ...room,
        jobs: job,
        manager: profileMap.get(room.manager_id) ?? null,
        driver: profileMap.get(room.driver_id) ?? null,
      },
    })
  } catch (error) {
    console.error('[GET /api/chats/[roomId]]', error)
    return NextResponse.json({ error: '채팅방 정보를 불러오지 못했습니다.' }, { status: 500 })
  }
}
