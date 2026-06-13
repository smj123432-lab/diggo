import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkAndTransitionJobStatus } from '@/lib/utils/dispatch'

// PATCH /api/applications/[id]/status — 지원 상태 변경 (소장: 검토중/수락/거절)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { status } = await request.json()

    const validStatuses = ['reviewing', 'accepted', 'rejected']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: '유효하지 않은 상태값입니다.' }, { status: 400 })
    }

    interface ApplicationWithJob {
      id: string
      job_id: string
      driver_id: string | null
      jobs: { manager_id: string; title: string } | null
    }

    const { data: application } = await supabase
      .from('applications')
      .select('id, job_id, driver_id, jobs(manager_id, title)')
      .eq('id', id)
      .single() as { data: ApplicationWithJob | null; error: unknown }

    if (!application) {
      return NextResponse.json({ error: '지원 내역을 찾을 수 없습니다.' }, { status: 404 })
    }

    const job = application.jobs
    if (job?.manager_id !== user.id) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('applications')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // 검토중 전환 시 채팅방 생성
    if (status === 'reviewing') {
      await supabase.from('chats').insert({
        job_id: application.job_id,
        application_id: id,
      })
    }

    // 수락 시 — 모든 장비 슬롯이 배차됐을 때만 in_progress로 전환
    if (status === 'accepted') {
      await checkAndTransitionJobStatus(supabase, application.job_id)
    }

    // 수락/거절 시 기사에게 알림 전송 — 실패해도 메인 응답에 영향 없음
    if ((status === 'accepted' || status === 'rejected') && application.driver_id && job?.title) {
      try {
        const admin = createAdminClient()
        await admin.from('notifications').insert({
          user_id: application.driver_id,
          type: status === 'accepted' ? 'application_accepted' : 'application_rejected',
          message: status === 'accepted'
            ? `"${job.title}"에 지원이 수락되었습니다.`
            : `"${job.title}"에 지원이 거절되었습니다.`,
        })
      } catch (notifErr) {
        console.error('[PATCH /api/applications/[id]/status] 알림 전송 실패:', notifErr)
      }
    }

    // 일감 상태 변경 시 캐시 무효화 (모집중 → 작업중 즉시 반영)
    revalidateTag('jobs', 'max')

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[PATCH /api/applications/[id]/status]', error)
    return NextResponse.json({ error: '상태 변경에 실패했습니다.' }, { status: 500 })
  }
}
