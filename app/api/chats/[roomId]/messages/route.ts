import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ roomId: string }> }

// GET /api/chats/[roomId]/messages — 메시지 목록 (최신 50개)
export async function GET(_: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

    const { roomId } = await params

    // 참여자 검증
    const { data: room } = await supabase
      .from('chat_rooms')
      .select('manager_id, driver_id')
      .eq('id', roomId)
      .maybeSingle()

    if (!room || (room.manager_id !== user.id && room.driver_id !== user.id)) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(50)

    if (error) throw error

    // 상대방 메시지 일괄 읽음 처리
    await supabase
      .from('chat_messages')
      .update({ is_read: true })
      .eq('room_id', roomId)
      .eq('is_read', false)
      .neq('sender_id', user.id)

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[GET /api/chats/[roomId]/messages]', error)
    return NextResponse.json({ error: '메시지를 불러오지 못했습니다.' }, { status: 500 })
  }
}

// POST /api/chats/[roomId]/messages — 메시지 전송
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

    const { roomId } = await params
    const { message } = await request.json() as { message: string }

    if (!message?.trim()) {
      return NextResponse.json({ error: '메시지를 입력해 주세요.' }, { status: 400 })
    }

    // 참여자 검증
    const { data: room } = await supabase
      .from('chat_rooms')
      .select('manager_id, driver_id')
      .eq('id', roomId)
      .maybeSingle()

    if (!room || (room.manager_id !== user.id && room.driver_id !== user.id)) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({ room_id: roomId, sender_id: user.id, message: message.trim() })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/chats/[roomId]/messages]', error)
    return NextResponse.json({ error: '메시지 전송에 실패했습니다.' }, { status: 500 })
  }
}
