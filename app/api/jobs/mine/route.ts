import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/jobs/mine — 소장의 내 등록 일감 목록
export async function GET(_: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('manager_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[GET /api/jobs/mine]', error)
    return NextResponse.json({ error: '일감 목록을 불러오지 못했습니다.' }, { status: 500 })
  }
}
