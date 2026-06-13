import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { checkAndTransitionJobStatus } from '@/lib/utils/dispatch'

// PATCH /api/chats/[roomId]/dispatch — 소장이 채팅방에서 기사 배치 수락/거절
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

    // 채팅방 확인 및 소장 권한 검증
    const { data: room } = await supabase
      .from('chat_rooms')
      .select('job_id, driver_id, manager_id, jobs(title)')
      .eq('id', roomId)
      .single()

    if (!room) return NextResponse.json({ error: '채팅방을 찾을 수 없습니다.' }, { status: 404 })
    if (room.manager_id !== user.id) return NextResponse.json({ error: '소장만 배치를 처리할 수 있습니다.' }, { status: 403 })

    // job_id + driver_id로 지원서 조회
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

    // 수락 시 — 모든 장비 슬롯이 배차됐을 때만 in_progress로 전환
    if (action === 'accept') {
      await checkAndTransitionJobStatus(supabase, room.job_id)
    }

    // 수락/거절 시 기사에게 알림 전송 — 실패해도 메인 응답에 영향 없음
    try {
      const jobTitle = (room.jobs as unknown as { title: string } | null)?.title
      if (jobTitle) {
        const admin = createAdminClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
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

    // 일감 상태 변경 시 캐시 무효화 (모집중 → 작업중 즉시 반영)
    revalidateTag('jobs', 'max')

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[PATCH /api/chats/[roomId]/dispatch]', error)
    return NextResponse.json({ error: '처리에 실패했습니다.' }, { status: 500 })
  }
}
