// 일별 장부 상세 API — 특정 날짜의 수입/지출/현장 항목 반환
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  buildIncomeEntries,
  buildExpenseEntries,
  buildJobEntries,
} from '@/lib/utils/ledger'

export async function GET(
  _: NextRequest,
  { params }: { params: { date: string } }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { date } = params // YYYY-MM-DD

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'manager') {
      const { data: rawJobs } = await supabase
        .from('jobs')
        .select('id, title, work_date, location, equipment_codes')
        .eq('manager_id', user.id)
        .eq('work_date', date)

      const { data: rawExpenses } = await supabase
        .from('ledger_expenses')
        .select('id, expense_date, category, memo, amount')
        .eq('driver_id', user.id)
        .eq('expense_date', date)

      return NextResponse.json({
        data: {
          incomes: [],
          expenses: buildExpenseEntries(rawExpenses ?? []),
          jobs: buildJobEntries(rawJobs ?? []),
        },
      })
    }

    // 기사
    const { data: rawApps } = await supabase
      .from('applications')
      .select('job_id, equipment_id, equipments(model_code), jobs(id, title, location, work_date, pay_amounts, pay_due_type, status)')
      .eq('driver_id', user.id)
      .eq('status', 'accepted')
      .eq('jobs.work_date', date)

    const { data: rawExpenses } = await supabase
      .from('ledger_expenses')
      .select('id, expense_date, category, memo, amount')
      .eq('driver_id', user.id)
      .eq('expense_date', date)

    return NextResponse.json({
      data: {
        incomes: buildIncomeEntries(
          ((rawApps ?? []).filter((a) => a.jobs !== null) as unknown) as Parameters<typeof buildIncomeEntries>[0]
        ),
        expenses: buildExpenseEntries(rawExpenses ?? []),
        jobs: [],
      },
    })
  } catch (error) {
    console.error('[GET /api/ledger/daily]', error)
    return NextResponse.json({ error: '일별 장부를 불러오지 못했습니다.' }, { status: 500 })
  }
}
