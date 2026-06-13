// 채팅방 페이지 (서버 컴포넌트 래퍼)
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ChatRoomComponent from '@/components/features/chat/ChatRoom'
import type { ChatRoomWithDetails, ChatMessage, ApplicationStatus } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

export default function ChatRoomPage({ params }: Props) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <ChatRoomContent params={params} />
    </Suspense>
  )
}

async function ChatRoomContent({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 채팅방 기본 정보 조회 (profile join 없이 — FK가 auth.users 참조라 auto-join 불가)
  const { data: room } = await supabase
    .from('chat_rooms')
    .select('id, job_id, manager_id, driver_id, manager_left, driver_left, created_at')
    .eq('id', id)
    .maybeSingle()

  // 없거나 참여자가 아니면 목록으로
  if (!room || (room.manager_id !== user.id && room.driver_id !== user.id)) {
    redirect('/chats')
  }

  // jobs, 프로필, 메시지, 지원서 상태 병렬 조회
  const [
    { data: job },
    { data: profiles },
    { data: messages },
    { data: application },
  ] = await Promise.all([
    supabase
      .from('jobs')
      .select('id, title, work_date, equipment_codes')
      .eq('id', room.job_id)
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('id, name, avatar_url')
      .in('id', [room.manager_id, room.driver_id]),
    supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', id)
      .order('created_at', { ascending: true })
      .limit(50),
    supabase
      .from('applications')
      .select('status')
      .eq('job_id', room.job_id)
      .eq('driver_id', room.driver_id)
      .maybeSingle(),
  ])

  // 상대방 메시지 읽음 처리 (비동기, 결과 기다리지 않음)
  supabase
    .from('chat_messages')
    .update({ is_read: true })
    .eq('room_id', id)
    .eq('is_read', false)
    .neq('sender_id', user.id)
    .then(() => {})

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))

  const normalizedRoom: ChatRoomWithDetails = {
    ...room,
    jobs: job as ChatRoomWithDetails['jobs'],
    manager: profileMap.get(room.manager_id) as ChatRoomWithDetails['manager'],
    driver: profileMap.get(room.driver_id) as ChatRoomWithDetails['driver'],
  }

  return (
    <ChatRoomComponent
      room={normalizedRoom}
      initialMessages={(messages ?? []) as ChatMessage[]}
      currentUserId={user.id}
      initialApplicationStatus={(application?.status ?? null) as ApplicationStatus | null}
    />
  )
}
