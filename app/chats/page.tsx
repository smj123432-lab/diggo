// 채팅 목록 페이지 (서버 컴포넌트)
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ChatList from '@/components/features/chat/ChatList'
import type { ChatRoomWithDetails } from '@/types'

export default async function ChatsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 내 채팅방 목록 (profile join 없이)
  const { data: rooms } = await supabase
    .from('chat_rooms')
    .select('id, job_id, manager_id, driver_id, created_at')
    .or(`manager_id.eq.${user.id},driver_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  if (!rooms || rooms.length === 0) {
    return (
      <main className="min-h-screen bg-white max-w-2xl mx-auto">
        <ChatList rooms={[]} currentUserId={user.id} />
      </main>
    )
  }

  // 관련 job_id, profile id 수집 → 병렬 조회
  const jobIds = [...new Set(rooms.map((r) => r.job_id))]
  const profileIds = [...new Set(rooms.flatMap((r) => [r.manager_id, r.driver_id]))]

  const [{ data: jobs }, { data: profiles }] = await Promise.all([
    supabase.from('jobs').select('id, title, work_date, equipment_codes').in('id', jobIds),
    supabase.from('profiles').select('id, name, avatar_url').in('id', profileIds),
  ])

  const jobMap = new Map((jobs ?? []).map((j) => [j.id, j]))
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))

  // 각 방의 마지막 메시지 + 미읽음 수 병렬 조회
  const enriched: ChatRoomWithDetails[] = await Promise.all(
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

  return (
    <main className="min-h-screen bg-white max-w-2xl mx-auto">
      <ChatList rooms={enriched} currentUserId={user.id} />
    </main>
  )
}
