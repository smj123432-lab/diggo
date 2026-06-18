import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { getServerTodayStr } from '@/lib/utils/date'

// GET /api/jobs — 일감 목록 (필터, 페이지네이션)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const offset = parseInt(searchParams.get('offset') ?? '0')
    const limit = parseInt(searchParams.get('limit') ?? '12')
    const equipment_codes = searchParams.getAll('equipment_code')
    const job_types = searchParams.getAll('job_type')
    const status = searchParams.get('status')
    const keyword = searchParams.get('keyword')

    const sortBy = searchParams.get('sortBy') ?? 'latest'
    const from = offset
    const to = from + limit - 1

    let query = supabase
      .from('jobs')
      .select('*, profiles(id, name, rating_avg, review_count, is_certified, avatar_url, penalty_count)', { count: 'exact' })
      .range(from, to)

    if (sortBy === 'deadline') {
      query = query.order('work_date', { ascending: true })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    // status 명시 시 해당 값만, 기본은 오늘 이후 work_date인 open 일감만 노출
    if (status) {
      query = query.eq('status', status)
    } else {
      const today = getServerTodayStr()
      query = query.eq('status', 'open').gte('work_date', today)
    }

    if (equipment_codes.length > 0) query = query.overlaps('equipment_codes', equipment_codes)
    if (job_types.length > 0) query = query.in('job_type', job_types)
    if (keyword) query = query.ilike('location', `%${keyword}%`)

    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json({ data, count, offset, limit })
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
      .select('role, banned_until')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'manager' && profile?.role !== 'admin') {
      return NextResponse.json({ error: '소장만 일감을 등록할 수 있습니다.' }, { status: 403 })
    }

    if (profile.banned_until && new Date(profile.banned_until) > new Date()) {
      const until = new Date(profile.banned_until).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
      return NextResponse.json({ error: `패널티 누적으로 ${until}까지 일감 등록이 제한됩니다.`, banned_until: profile.banned_until }, { status: 403 })
    }

    const body = await request.json()

    // 허용 필드만 명시적으로 추출 (mass assignment 방지)
    const {
      title, job_type, equipment_codes, description,
      attachments, caution, location, latitude, longitude,
      pay_amounts, work_days, work_date, work_duration, pay_due_type,
    } = body

    if (
      !title || !job_type ||
      !Array.isArray(equipment_codes) || equipment_codes.length === 0 ||
      !description || !location || !work_date || !pay_due_type ||
      !pay_amounts || typeof pay_amounts !== 'object' ||
      equipment_codes.some((c: string) => !pay_amounts[c])
    ) {
      return NextResponse.json({ error: '필수 항목을 모두 입력해주세요.' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('jobs')
      .insert({
        manager_id: user.id,
        title, job_type, equipment_codes, description,
        attachments: attachments ?? null,
        caution: caution ?? null,
        location, latitude, longitude,
        pay_amounts, work_days: work_days ?? {}, work_date,
        work_duration: work_duration ?? null,
        pay_due_type,
        status: 'open',
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/jobs')
    revalidateTag('jobs', 'max')

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/jobs]', error)
    return NextResponse.json({ error: '일감 등록에 실패했습니다.' }, { status: 500 })
  }
}
