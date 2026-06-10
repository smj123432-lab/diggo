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

  const { data: rooms } = await supabase
    .from('chat_rooms')
    .select('id, job_id, manager_id, driver_id, created_at')
    .or(`manager_id.eq.${user.id},driver_id.eq.${user.id}`)
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

    enriched = await Promise.all(
      rooms.map(async (room) => {
        const [{ data: lastMsgs }, { count: unread }] = await Promise.all([
          supabase
            .from('chat_messages')
            .select('id, message, sender_id, created_at')
            .eq('room_id', room.id)
            .order('created_at', { ascending: false })
            .limit(1),
          supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id)
            .eq('is_read', false)
            .neq('sender_id', user.id),
        ])
        return {
          ...room,
          jobs: jobMap.get(room.job_id) as ChatRoomWithDetails['jobs'],
          manager: profileMap.get(room.manager_id) as ChatRoomWithDetails['manager'],
          driver: profileMap.get(room.driver_id) as ChatRoomWithDetails['driver'],
          last_message: (lastMsgs?.[0] as ChatRoomWithDetails['last_message']) ?? null,
          unread_count: unread ?? 0,
        }
      })
    )
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
