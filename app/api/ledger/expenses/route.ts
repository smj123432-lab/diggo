import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/ledger/expenses — 지출 추가 (기사)
export async function POST(request: NextRequest) {
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
      .from('ledger_expenses')
      .insert({ ...body, driver_id: user.id })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/ledger/expenses]', error)
    return NextResponse.json({ error: '지출 등록에 실패했습니다.' }, { status: 500 })
  }
}
