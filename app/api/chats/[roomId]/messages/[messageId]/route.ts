import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ roomId: string; messageId: string }> }

// DELETE /api/chats/[roomId]/messages/[messageId] — 내 메시지 소프트 딜리트
export async function DELETE(_: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

    const { roomId, messageId } = await params

    // 본인 메시지인지 검증
    const { data: msg } = await supabase
      .from('chat_messages')
      .select('sender_id, room_id')
      .eq('id', messageId)
      .eq('room_id', roomId)
      .maybeSingle()

    if (!msg) return NextResponse.json({ error: '메시지를 찾을 수 없습니다.' }, { status: 404 })
    if (msg.sender_id !== user.id) {
      return NextResponse.json({ error: '본인 메시지만 삭제할 수 있습니다.' }, { status: 403 })
    }

    const { error } = await supabase
      .from('chat_messages')
      .update({ is_deleted: true })
      .eq('id', messageId)

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[DELETE /api/chats/[roomId]/messages/[messageId]]', error)
    return NextResponse.json({ error: '메시지 삭제에 실패했습니다.' }, { status: 500 })
  }
}
