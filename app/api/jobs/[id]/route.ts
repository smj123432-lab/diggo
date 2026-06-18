import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { getAuthUser, unauthorizedResponse } from '@/lib/api/auth'
import { MAX_PAY_AMOUNT } from '@/lib/constants'

// GET /api/jobs/[id] — 일감 상세
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const { supabase } = await getAuthUser()
    const { data, error } = await supabase
      .from('jobs')
      .select('*, profiles(id, name, rating_avg, review_count, is_certified, phone)')
      .eq('id', id)
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
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const { supabase, user } = await getAuthUser()

    if (!user) {
      return unauthorizedResponse()
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

    // pay_amounts 범위 검사 (int4 overflow 방지)
    if (update.pay_amounts !== undefined) {
      const amountValues = Object.values(update.pay_amounts as Record<string, unknown>)
      if (amountValues.some((v) => typeof v !== 'number' || v < 0 || v > MAX_PAY_AMOUNT)) {
        return NextResponse.json(
          { error: `금액은 0원 이상 ${MAX_PAY_AMOUNT.toLocaleString()}원 이하로 입력해주세요.` },
          { status: 400 }
        )
      }
    }

    const { data, error } = await supabase
      .from('jobs')
      .update(update)
      .eq('id', id)
      .eq('manager_id', user.id)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/jobs')
    revalidatePath(`/jobs/${id}`)
    revalidateTag('jobs', 'max')

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[PATCH /api/jobs/[id]]', error)
    return NextResponse.json({ error: '일감 수정에 실패했습니다.' }, { status: 500 })
  }
}

// DELETE /api/jobs/[id] — 일감 삭제 (소장 전용, 모집중/마감 상태만)
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const { supabase, user } = await getAuthUser()

    if (!user) {
      return unauthorizedResponse()
    }

    // 소장 본인 + 작업중/완료 아닌 상태만 삭제 허용
    const { data: job } = await supabase
      .from('jobs')
      .select('status, manager_id')
      .eq('id', id)
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
      .eq('id', id)

    if (error) throw error

    revalidatePath('/jobs')
    revalidateTag('jobs', 'max')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/jobs/[id]]', error)
    return NextResponse.json({ error: '일감 삭제에 실패했습니다.' }, { status: 500 })
  }
}
