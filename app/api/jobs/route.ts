import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// GET /api/jobs — 일감 목록 (필터, 페이지네이션)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = parseInt(searchParams.get('limit') ?? '10')
    const equipment_codes = searchParams.getAll('equipment_code')
    const job_types = searchParams.getAll('job_type')
    const status = searchParams.get('status') ?? 'open'

    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('jobs')
      .select('*, profiles(id, name, rating_avg, is_certified)', { count: 'exact' })
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (equipment_codes.length > 0) query = query.in('equipment_code', equipment_codes)
    if (job_types.length > 0) query = query.in('job_type', job_types)

    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json({ data, count, page, limit })
  } catch (error) {
    console.error('[GET /api/jobs]', error)
    return NextResponse.json({ error: '일감 목록을 불러오지 못했습니다.' }, { status: 500 })
  }
}

// POST /api/jobs — 일감 등록 (소장 전용)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'manager' && profile?.role !== 'admin') {
      return NextResponse.json({ error: '소장만 일감을 등록할 수 있습니다.' }, { status: 403 })
    }

    const body = await request.json()
    const { data, error } = await supabase
      .from('jobs')
      .insert({ ...body, manager_id: user.id })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/jobs')

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/jobs]', error)
    return NextResponse.json({ error: '일감 등록에 실패했습니다.' }, { status: 500 })
  }
}
