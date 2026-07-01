// 채팅 메시지 소프트 삭제 — 본인 메시지만 가능
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, unauthorizedResponse } from '@/lib/api/auth'

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const { supabase, user } = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const { messageId } = await params

    const { data: msg } = await supabase
      .from('chat_messages')
      .select('id, sender_id')
      .eq('id', messageId)
      .maybeSingle()

    if (!msg) return NextResponse.json({ error: '메시지를 찾을 수 없습니다.' }, { status: 404 })
    if (msg.sender_id !== user.id) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

    const { error } = await supabase
      .from('chat_messages')
      .update({ is_deleted: true })
      .eq('id', messageId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/chats/messages/[messageId]]', error)
    return NextResponse.json({ error: '메시지 삭제에 실패했습니다.' }, { status: 500 })
  }
}
