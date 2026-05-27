import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/ledger/monthly?year=2025&month=5 — 월별 수입 요약
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()))
    const month = parseInt(searchParams.get('month') ?? String(new Date().getMonth() + 1))

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]

    // 완료된 일감에서 수입 계산
    const { data: jobs } = await supabase
      .from('applications')
      .select('equipment_id, jobs(pay_amounts, equipment_codes, work_date, title, pay_due_type)')
      .eq('driver_id', user.id)
      .eq('status', 'accepted')
      .gte('jobs.work_date', startDate)
      .lte('jobs.work_date', endDate)

    // 지출 합계
    const { data: expenses } = await supabase
      .from('ledger_expenses')
      .select('*')
      .eq('driver_id', user.id)
      .gte('expense_date', startDate)
      .lte('expense_date', endDate)

    const totalIncome = jobs?.reduce((sum, a) => {
      const job = (a.jobs as unknown) as { pay_amounts: Record<string, number>; equipment_codes: string[] } | null
      if (!job) return sum
      // 기사가 사용한 장비의 단가 합산 (단일 장비 선택 시 해당 금액, 복수 선택 시 첫 번째)
      const amounts = Object.values(job.pay_amounts ?? {})
      return sum + (amounts[0] ?? 0)
    }, 0) ?? 0

    const totalExpense = expenses?.reduce((sum, e) => sum + e.amount, 0) ?? 0

    return NextResponse.json({
      data: {
        year,
        month,
        total_income: totalIncome,
        total_expense: totalExpense,
        net_income: totalIncome - totalExpense,
        jobs,
        expenses,
      },
    })
  } catch (error) {
    console.error('[GET /api/ledger/monthly]', error)
    return NextResponse.json({ error: '장부를 불러오지 못했습니다.' }, { status: 500 })
  }
}
