// app/api/ledger/monthly/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  buildIncomeEntries,
  buildExpenseEntries,
  buildJobEntries,
  buildMonthData,
} from '@/lib/utils/ledger'

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

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'manager') {
      // 소장: 자신이 등록한 일감 (work_date 기준)
      const { data: rawJobs } = await supabase
        .from('jobs')
        .select('id, title, work_date, location, equipment_codes')
        .eq('manager_id', user.id)
        .gte('work_date', startDate)
        .lte('work_date', endDate)

      // 소장의 수동 지출
      const { data: rawExpenses } = await supabase
        .from('ledger_expenses')
        .select('id, expense_date, category, memo, amount')
        .eq('driver_id', user.id)
        .gte('expense_date', startDate)
        .lte('expense_date', endDate)

      const jobs = buildJobEntries(rawJobs ?? [])
      const expenses = buildExpenseEntries(rawExpenses ?? [])
      const monthData = buildMonthData({ year, month, incomes: [], expenses, jobs })

      return NextResponse.json({ data: monthData })
    }

    // 기사: 1단계 — accepted application 조회
    const { data: rawApps } = await supabase
      .from('applications')
      .select('job_id, equipment_id, equipments(model_code)')
      .eq('driver_id', user.id)
      .eq('status', 'accepted')

    const jobIds = (rawApps ?? []).map((a) => a.job_id).filter(Boolean)

    // 기사: 2단계 — job_ids로 jobs 조회 (work_date 필터 여기서 적용)
    const { data: rawJobs } = jobIds.length
      ? await supabase
          .from('jobs')
          .select('id, title, location, work_date, pay_amounts, pay_due_type, status')
          .in('id', jobIds)
          .gte('work_date', startDate)
          .lte('work_date', endDate)
      : { data: [] }

    // application과 job 매핑
    const jobMap = new Map((rawJobs ?? []).map((j) => [j.id, j]))

    const appsForMonth = (rawApps ?? []).filter((a) => jobMap.has(a.job_id))

    const incomeRaw = appsForMonth.map((a) => ({
      equipment_id: a.equipment_id,
      equipments: (a.equipments as unknown as { model_code: string } | null),
      jobs: jobMap.get(a.job_id) ?? null,
    }))

    // 기사: 지출 조회
    const { data: rawExpenses } = await supabase
      .from('ledger_expenses')
      .select('id, expense_date, category, memo, amount')
      .eq('driver_id', user.id)
      .gte('expense_date', startDate)
      .lte('expense_date', endDate)

    const incomes = buildIncomeEntries(incomeRaw as Parameters<typeof buildIncomeEntries>[0])
    const expenses = buildExpenseEntries(rawExpenses ?? [])
    const monthData = buildMonthData({ year, month, incomes, expenses, jobs: [] })

    return NextResponse.json({ data: monthData })
  } catch (error) {
    console.error('[GET /api/ledger/monthly]', error)
    return NextResponse.json({ error: '장부를 불러오지 못했습니다.' }, { status: 500 })
  }
}
