import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PENALTY_BAN_THRESHOLDS } from '@/types'

/**
 * PATCH /api/applications/[id]/cancel
 *
 * 배차 확정(accepted) 후 일방적 취소 시 패널티를 부여하고 상태를 전환한다.
 *
 * **패널티 부여 흐름**
 * 1. 요청자 role 확인 → driver: cancelled_by_driver / manager: cancelled_by_manager
 * 2. 현재 status가 'accepted'인 경우에만 허용 (검토중/거절 취소는 이 API 외 처리)
 * 3. 취소한 사람의 profiles.penalty_count += 1
 * 4. 상대방에게 취소 알림 fire-and-forget
 * 5. jobs 캐시 무효화 (in_progress → open 복귀 가능)
 */
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role

    interface ApplicationWithJob {
      id: string
      job_id: string
      driver_id: string | null
      status: string
      jobs: { manager_id: string; title: string } | null
    }

    const { data: application } = await supabase
      .from('applications')
      .select('id, job_id, driver_id, status, jobs(manager_id, title)')
      .eq('id', id)
      .single() as { data: ApplicationWithJob | null; error: unknown }

    if (!application) {
      return NextResponse.json({ error: '지원 내역을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 권한 확인 — 기사(본인 지원) 또는 소장(내 일감 지원)만 허용
    const isDriver = role === 'driver' && application.driver_id === user.id
    const isManager = role === 'manager' && application.jobs?.manager_id === user.id

    if (!isDriver && !isManager) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    // 배차 확정 상태에서만 취소 가능 (패널티 부여 대상)
    if (application.status !== 'accepted') {
      return NextResponse.json({ error: '배차 확정 상태에서만 취소할 수 있습니다.' }, { status: 400 })
    }

    const newStatus = isDriver ? 'cancelled_by_driver' : 'cancelled_by_manager'

    // RLS: 기사는 applications UPDATE 권한이 없으므로 admin 클라이언트로 우회
    // 권한 검증은 위에서 코드 레벨로 완료했으므로 안전
    const admin = createAdminClient()

    const { data, error } = await admin
      .from('applications')
      .update({ status: newStatus })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // 취소한 사람의 패널티 카운터 증가 + 임계값 도달 시 이용 제한
    const { data: currentProfile } = await admin
      .from('profiles')
      .select('penalty_count')
      .eq('id', user.id)
      .single()

    const newCount = (currentProfile?.penalty_count ?? 0) + 1
    const banDays = PENALTY_BAN_THRESHOLDS[newCount]
    const updateData: Record<string, unknown> = { penalty_count: newCount }
    if (banDays) {
      updateData.banned_until = new Date(Date.now() + banDays * 86400000).toISOString()
    }
    await admin.from('profiles').update(updateData).eq('id', user.id)

    // 상대방에게 취소 알림 — 실패해도 취소 결과에 영향 없음
    try {
      const jobTitle = application.jobs?.title
      const recipientId = isDriver ? application.jobs?.manager_id : application.driver_id

      if (jobTitle && recipientId) {
        await admin.from('notifications').insert({
          user_id: recipientId,
          type: 'application_cancelled',
          message: isDriver
            ? `"${jobTitle}" 배차가 기사에 의해 취소되었습니다.`
            : `"${jobTitle}" 배차가 소장에 의해 취소되었습니다.`,
        })
      }
    } catch (notifErr) {
      console.error('[PATCH /api/applications/[id]/cancel] 알림 전송 실패:', notifErr)
    }

    revalidateTag('jobs', 'max')

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[PATCH /api/applications/[id]/cancel]', error)
    return NextResponse.json({ error: '취소 처리에 실패했습니다.' }, { status: 500 })
  }
}
