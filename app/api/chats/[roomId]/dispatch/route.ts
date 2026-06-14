import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkAndTransitionJobStatus } from '@/lib/utils/dispatch'

/**
 * PATCH /api/chats/[roomId]/dispatch
 *
 * 소장이 채팅방 내 ⋮ 메뉴에서 기사 배치를 수락 또는 거절한다.
 *
 * **배차 확정 흐름**
 * 1. application.status를 accepted/rejected로 갱신
 * 2. 수락 시 `checkAndTransitionJobStatus`를 호출해 해당 일감의 모든 장비 슬롯이
 *    채워졌는지 검사 → 충족되면 jobs.status를 in_progress로 자동 전환
 * 3. 알림 전송은 fire-and-forget — 실패해도 배차 결과에 영향 없음
 * 4. 일감 상태가 변경될 수 있으므로 Next.js 'jobs' 캐시 태그를 즉시 무효화
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

    const { action } = await request.json() as { action: 'accept' | 'reject' }
    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: '유효하지 않은 액션입니다.' }, { status: 400 })
    }

    interface ChatRoomWithJob {
      job_id: string
      driver_id: string
      manager_id: string
      jobs: { title: string } | null
    }

    const { data: room } = await supabase
      .from('chat_rooms')
      .select('job_id, driver_id, manager_id, jobs(title)')
      .eq('id', roomId)
      .single() as { data: ChatRoomWithJob | null; error: unknown }

    if (!room) return NextResponse.json({ error: '채팅방을 찾을 수 없습니다.' }, { status: 404 })
    if (room.manager_id !== user.id) return NextResponse.json({ error: '소장만 배치를 처리할 수 있습니다.' }, { status: 403 })

    const { data: application } = await supabase
      .from('applications')
      .select('id')
      .eq('job_id', room.job_id)
      .eq('driver_id', room.driver_id)
      .single()

    if (!application) return NextResponse.json({ error: '지원 내역을 찾을 수 없습니다.' }, { status: 404 })

    const newStatus = action === 'accept' ? 'accepted' : 'rejected'

    const { data, error } = await supabase
      .from('applications')
      .update({ status: newStatus })
      .eq('id', application.id)
      .select()
      .single()

    if (error) throw error

    // 모든 장비 슬롯이 배차됐을 때만 일감을 in_progress로 전환 (부분 배차 상태 보호)
    if (action === 'accept') {
      await checkAndTransitionJobStatus(supabase, room.job_id)
    }

    // 알림 전송 실패가 배차 응답을 막지 않도록 별도 try-catch로 격리
    try {
      const jobTitle = room.jobs?.title
      if (jobTitle) {
        const admin = createAdminClient()
        await admin.from('notifications').insert({
          user_id: room.driver_id,
          type: action === 'accept' ? 'application_accepted' : 'application_rejected',
          message: action === 'accept'
            ? `"${jobTitle}"에 배치가 수락되었습니다.`
            : `"${jobTitle}"에 배치가 거절되었습니다.`,
        })
      }
    } catch (notifErr) {
      console.error('[PATCH /api/chats/[roomId]/dispatch] 알림 전송 실패:', notifErr)
    }

    // 일감 상태가 open → in_progress로 바뀔 수 있으므로 캐시를 즉시 무효화
    revalidateTag('jobs', 'max')

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[PATCH /api/chats/[roomId]/dispatch]', error)
    return NextResponse.json({ error: '처리에 실패했습니다.' }, { status: 500 })
  }
}
