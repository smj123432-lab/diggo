import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, unauthorizedResponse } from '@/lib/api/auth'

// POST /api/ledger/expenses — 지출 추가 (기사)
export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthUser()

    if (!user) {
      return unauthorizedResponse()
    }

    const { category, amount, expense_date, memo } = await request.json()
    const { data, error } = await supabase
      .from('ledger_expenses')
      .insert({ category, amount, expense_date, memo, driver_id: user.id })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/ledger/expenses]', error)
    return NextResponse.json({ error: '지출 등록에 실패했습니다.' }, { status: 500 })
  }
}
