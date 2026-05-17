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
    const { data, error } = await supabase
      .from('jobs')
      .update(body)
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
