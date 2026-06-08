// 채팅 목록 페이지 (서버 컴포넌트)
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ChatList from '@/components/features/chat/ChatList'
import type { ChatRoomWithDetails } from '@/types'

export default async function ChatsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rooms } = await supabase
    .from('chat_rooms')
    .select(`
      id, job_id, manager_id, driver_id, created_at,
      jobs:job_id ( id, title, work_date, equipment_codes ),
      manager:manager_id ( id, name, avatar_url ),
      driver:driver_id ( id, name, avatar_url )
    `)
    .or(`manager_id.eq.${user.id},driver_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  // 마지막 메시지 + 미읽음 수 병렬 조회
  const enriched: ChatRoomWithDetails[] = await Promise.all(
    (rooms ?? []).map(async (room) => {
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
        jobs: (Array.isArray(room.jobs) ? room.jobs[0] : room.jobs) as ChatRoomWithDetails['jobs'],
        manager: (Array.isArray(room.manager) ? room.manager[0] : room.manager) as ChatRoomWithDetails['manager'],
        driver: (Array.isArray(room.driver) ? room.driver[0] : room.driver) as ChatRoomWithDetails['driver'],
        last_message: (lastMsgs?.[0] as ChatRoomWithDetails['last_message']) ?? null,
        unread_count: unread ?? 0,
      }
    })
  )

  return (
    <main className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <h1 className="text-base font-bold text-slate-900">채팅</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto bg-white min-h-screen">
        <ChatList rooms={enriched} currentUserId={user.id} />
      </div>
    </main>
  )
}
