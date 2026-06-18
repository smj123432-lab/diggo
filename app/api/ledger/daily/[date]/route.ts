// 일별 장부 상세 API — 특정 날짜의 수입/지출/현장 항목 반환
import { NextRequest, NextResponse } from 'next/server'
import {
  buildIncomeEntries,
  buildExpenseEntries,
  buildJobEntries,
} from '@/lib/utils/ledger'
import { getAuthUserWithProfile } from '@/lib/api/auth'

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  const { date } = await params
  try {
    const auth = await getAuthUserWithProfile()
    if ('error' in auth) return auth.error

    const { supabase, user, profile } = auth

    if (profile?.role === 'manager') {
      const { data: rawJobs } = await supabase
        .from('jobs')
        .select('id, title, work_date, location, equipment_codes, pay_amounts, work_days, status')
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
      .select('job_id, equipment_id, applied_equipment_code, equipments(model_code), jobs(id, title, location, work_date, pay_amounts, pay_due_type, status, equipment_codes)')
      .eq('driver_id', user.id)
      .eq('status', 'accepted')
      .eq('jobs.work_date', date)

    const { data: rawExpenses } = await supabase
      .from('ledger_expenses')
      .select('id, expense_date, category, memo, amount')
      .eq('driver_id', user.id)
      .eq('expense_date', date)

    type IncomeInput = Parameters<typeof buildIncomeEntries>[0][number]
    const incomeApps: IncomeInput[] = (rawApps ?? [])
      .filter((a) => a.jobs !== null)
      .map((a) => ({
        equipment_id: a.equipment_id as string | null,
        applied_equipment_code: a.applied_equipment_code as string | null,
        equipments: (Array.isArray(a.equipments) ? a.equipments[0] ?? null : a.equipments) as { model_code: string } | null,
        jobs: (Array.isArray(a.jobs) ? a.jobs[0] ?? null : a.jobs) as IncomeInput['jobs'],
      }))

    return NextResponse.json({
      data: {
        incomes: buildIncomeEntries(incomeApps),
        expenses: buildExpenseEntries(rawExpenses ?? []),
        jobs: [],
      },
    })
  } catch (error) {
    console.error('[GET /api/ledger/daily]', error)
    return NextResponse.json({ error: '일별 장부를 불러오지 못했습니다.' }, { status: 500 })
  }
}
