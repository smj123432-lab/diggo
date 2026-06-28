import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, unauthorizedResponse } from '@/lib/api/auth'
import { createAdminClient } from '@/lib/supabase/admin'

type Params = { params: Promise<{ roomId: string }> }

// POST /api/chats/[roomId]/leave — 채팅방 나가기 (소프트 딜리트)
export async function POST(_: NextRequest, { params }: Params) {
  try {
    const { user } = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const { roomId } = await params
    const admin = createAdminClient()

    const { data: room } = await admin
      .from('chat_rooms')
      .select('manager_id, driver_id')
      .eq('id', roomId)
      .maybeSingle()

    if (!room) return NextResponse.json({ error: '채팅방을 찾을 수 없습니다.' }, { status: 404 })

    const isManager = room.manager_id === user.id
    const isDriver  = room.driver_id  === user.id

    if (!isManager && !isDriver) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 })
    }

    const updateField = isManager ? { manager_left: true } : { driver_left: true }

    const { error } = await admin
      .from('chat_rooms')
      .update(updateField)
      .eq('id', roomId)

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[POST /api/chats/[roomId]/leave]', error)
    return NextResponse.json({ error: '채팅방 나가기에 실패했습니다.' }, { status: 500 })
  }
}
