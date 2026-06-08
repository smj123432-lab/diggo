// 채팅방 페이지 (서버 컴포넌트 래퍼)
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ChatRoomComponent from '@/components/features/chat/ChatRoom'
import type { ChatRoom, ChatRoomWithDetails, ChatMessage } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ChatRoomPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 채팅방 정보 조회
  const { data: room } = await supabase
    .from('chat_rooms')
    .select(`
      id, job_id, manager_id, driver_id, created_at,
      jobs:job_id ( id, title, work_date, equipment_codes ),
      manager:manager_id ( id, name, avatar_url ),
      driver:driver_id ( id, name, avatar_url )
    `)
    .eq('id', id)
    .maybeSingle()

  // 없거나 참여자가 아니면 목록으로
  if (!room || (room.manager_id !== user.id && room.driver_id !== user.id)) {
    redirect('/chats')
  }

  // 초기 메시지 50개 조회
  const { data: messages } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('room_id', id)
    .order('created_at', { ascending: true })
    .limit(50)

  // 상대방 메시지 읽음 처리
  await supabase
    .from('chat_messages')
    .update({ is_read: true })
    .eq('room_id', id)
    .eq('is_read', false)
    .neq('sender_id', user.id)

  // Supabase JOIN 반환값 정규화 (배열 → 단일 객체)
  const normalizedRoom: ChatRoomWithDetails = {
    ...(room as unknown as ChatRoom),
    jobs: (Array.isArray(room.jobs) ? room.jobs[0] : room.jobs) as ChatRoomWithDetails['jobs'],
    manager: (Array.isArray(room.manager) ? room.manager[0] : room.manager) as ChatRoomWithDetails['manager'],
    driver: (Array.isArray(room.driver) ? room.driver[0] : room.driver) as ChatRoomWithDetails['driver'],
  }

  return (
    <ChatRoomComponent
      room={normalizedRoom}
      initialMessages={(messages ?? []) as ChatMessage[]}
      currentUserId={user.id}
    />
  )
}
