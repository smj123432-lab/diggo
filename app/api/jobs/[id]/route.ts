import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// GET /api/jobs/[id] — 일감 상세
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('jobs')
      .select('*, profiles(id, name, rating_avg, is_certified, phone)')
      .eq('id', params.id)
      .single()

    if (error) throw error
    if (!data) return NextResponse.json({ error: '일감을 찾을 수 없습니다.' }, { status: 404 })

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[GET /api/jobs/[id]]', error)
    return NextResponse.json({ error: '일감 정보를 불러오지 못했습니다.' }, { status: 500 })
  }
}

// PATCH /api/jobs/[id] — 일감 수정 / 상태 변경 (소장 전용)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const body = await request.json()
    const ALLOWED: (keyof typeof body)[] = [
      'title', 'job_type', 'equipment_codes', 'description', 'attachments',
      'caution', 'location', 'latitude', 'longitude', 'pay_amounts', 'work_days',
      'work_date', 'work_duration', 'pay_due_type', 'status',
    ]
    const update = Object.fromEntries(
      Object.entries(body).filter(([k]) => ALLOWED.includes(k as keyof typeof body))
    )
    const { data, error } = await supabase
      .from('jobs')
      .update(update)
      .eq('id', params.id)
      .eq('manager_id', user.id)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/jobs')
    revalidatePath(`/jobs/${params.id}`)

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[PATCH /api/jobs/[id]]', error)
    return NextResponse.json({ error: '일감 수정에 실패했습니다.' }, { status: 500 })
  }
}

// DELETE /api/jobs/[id] — 일감 삭제 (소장 전용, 모집중/마감 상태만)
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    // 소장 본인 + 작업중/완료 아닌 상태만 삭제 허용
    const { data: job } = await supabase
      .from('jobs')
      .select('status, manager_id')
      .eq('id', params.id)
      .single()

    if (!job || job.manager_id !== user.id) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }
    if (job.status === 'in_progress' || job.status === 'completed' || job.status === 'settled') {
      return NextResponse.json({ error: '작업 진행중이거나 완료/정산된 일감은 삭제할 수 없습니다.' }, { status: 409 })
    }

    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', params.id)

    if (error) throw error

    revalidatePath('/jobs')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/jobs/[id]]', error)
    return NextResponse.json({ error: '일감 삭제에 실패했습니다.' }, { status: 500 })
  }
}
