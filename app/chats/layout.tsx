// 채팅 섹션 공용 레이아웃 — 목록 데이터 fetch + 분할 뷰 제공
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ChatSplitLayout from '@/components/features/chat/ChatSplitLayout'
import type { ChatRoomWithDetails } from '@/types'

export default async function ChatsLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single()

  // 나간 방은 목록에서 제외
  const { data: rooms } = await supabase
    .from('chat_rooms')
    .select('id, job_id, manager_id, driver_id, manager_left, driver_left, created_at')
    .or(
      `and(manager_id.eq.${user.id},manager_left.eq.false),` +
      `and(driver_id.eq.${user.id},driver_left.eq.false)`
    )
    .order('created_at', { ascending: false })

  let enriched: ChatRoomWithDetails[] = []

  if (rooms && rooms.length > 0) {
    const jobIds = [...new Set(rooms.map((r) => r.job_id))]
    const profileIds = [...new Set(rooms.flatMap((r) => [r.manager_id, r.driver_id]))]

    const [{ data: jobs }, { data: profiles }] = await Promise.all([
      supabase.from('jobs').select('id, title, work_date, equipment_codes').in('id', jobIds),
      supabase.from('profiles').select('id, name, avatar_url').in('id', profileIds),
    ])

    const jobMap = new Map((jobs ?? []).map((j) => [j.id, j]))
    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))

    // N+1 제거 — 마지막 메시지·미읽음 수를 IN 절로 일괄 조회 후 Map으로 조립
    const roomIds = rooms.map((r) => r.id)
    const [{ data: allMessages }, { data: allUnread }] = await Promise.all([
      supabase
        .from('chat_messages')
        .select('id, room_id, message, sender_id, created_at, is_deleted')
        .in('room_id', roomIds)
        .order('created_at', { ascending: false }),
      supabase
        .from('chat_messages')
        .select('room_id')
        .in('room_id', roomIds)
        .eq('is_read', false)
        .neq('sender_id', user.id),
    ])

    type LastMsg = ChatRoomWithDetails['last_message']
    const lastMsgMap = new Map<string, LastMsg>()
    for (const msg of (allMessages ?? []) as NonNullable<LastMsg>[]) {
      if (!lastMsgMap.has(msg.room_id)) lastMsgMap.set(msg.room_id, msg)
    }
    const unreadMap = new Map<string, number>()
    for (const msg of allUnread ?? []) {
      unreadMap.set(msg.room_id, (unreadMap.get(msg.room_id) ?? 0) + 1)
    }

    enriched = rooms.map((room) => ({
      ...room,
      jobs: jobMap.get(room.job_id) as ChatRoomWithDetails['jobs'],
      manager: profileMap.get(room.manager_id) as ChatRoomWithDetails['manager'],
      driver: profileMap.get(room.driver_id) as ChatRoomWithDetails['driver'],
      last_message: lastMsgMap.get(room.id) ?? null,
      unread_count: unreadMap.get(room.id) ?? 0,
    }))
  }

  return (
    <ChatSplitLayout
      rooms={enriched}
      currentUserId={user.id}
      currentUserName={profile?.name ?? '나'}
    >
      {children}
    </ChatSplitLayout>
  )
}
