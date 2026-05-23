import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/applications — 내 지원 목록 (기사)
export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('applications')
      .select('*, jobs(id, title, work_date, pay_amount, location, status)')
      .eq('driver_id', user.id)
      .order('applied_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[GET /api/applications]', error)
    return NextResponse.json({ error: '지원 목록을 불러오지 못했습니다.' }, { status: 500 })
  }
}

// POST /api/applications — 지원 신청 (기사)
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

    if (profile?.role !== 'driver') {
      return NextResponse.json({ error: '기사만 지원할 수 있습니다.' }, { status: 403 })
    }

    const { job_id, equipment_id } = await request.json()

    if (!job_id) {
      return NextResponse.json({ error: '일감 정보가 없습니다.' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('applications')
      .insert({
        job_id,
        driver_id: user.id,
        equipment_id: equipment_id ?? null,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: '이미 지원한 일감입니다.' }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/applications]', error)
    return NextResponse.json({ error: '지원 신청에 실패했습니다.' }, { status: 500 })
  }
}
