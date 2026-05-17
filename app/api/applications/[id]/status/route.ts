import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PATCH /api/applications/[id]/status — 지원 상태 변경 (소장: 검토중/수락/거절)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { status } = await request.json()

    const validStatuses = ['reviewing', 'accepted', 'rejected']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: '유효하지 않은 상태값입니다.' }, { status: 400 })
    }

    // 소장이 본인 일감의 지원인지 확인
    const { data: application } = await supabase
      .from('applications')
      .select('id, job_id, jobs(manager_id)')
      .eq('id', params.id)
      .single()

    if (!application) {
      return NextResponse.json({ error: '지원 내역을 찾을 수 없습니다.' }, { status: 404 })
    }

    const job = (application.jobs as unknown) as { manager_id: string } | null
    if (job?.manager_id !== user.id) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('applications')
      .update({ status })
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    // 검토중 전환 시 채팅방 생성
    if (status === 'reviewing') {
      await supabase.from('chats').insert({
        job_id: application.job_id,
        application_id: params.id,
      })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[PATCH /api/applications/[id]/status]', error)
    return NextResponse.json({ error: '상태 변경에 실패했습니다.' }, { status: 500 })
  }
}
