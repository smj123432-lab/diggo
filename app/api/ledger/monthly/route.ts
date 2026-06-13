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
    // toISOString()은 UTC 변환으로 KST(+9)에서 하루 밀릴 수 있어 직접 문자열 조합
    const lastDay = new Date(year, month, 0).getDate()
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    // 이번 달 이전에 시작해 이번 달로 이어지는 일감도 포함하기 위한 룩백
    const lookbackDate = new Date(new Date(`${startDate}T00:00:00Z`).getTime() - 31 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0]

    if (profile?.role === 'manager') {
      // 소장: 일감 + 수동 지출 병렬 조회
      const [{ data: rawJobs }, { data: rawExpenses }] = await Promise.all([
        supabase
          .from('jobs')
          .select('id, title, work_date, location, equipment_codes, pay_amounts, work_days, status')
          .eq('manager_id', user.id)
          .gte('work_date', lookbackDate)
          .lte('work_date', endDate),
        supabase
          .from('ledger_expenses')
          .select('id, expense_date, category, memo, amount')
          .eq('driver_id', user.id)
          .gte('expense_date', startDate)
          .lte('expense_date', endDate),
      ])

      const allJobs = buildJobEntries(rawJobs ?? [])
      // 생성된 entries 중 이번 달 범위 내 날짜만 포함
      const jobs = allJobs.filter(e => e.date >= startDate && e.date <= endDate)
      const expenses = buildExpenseEntries(rawExpenses ?? [])
      const monthData = buildMonthData({ year, month, incomes: [], expenses, jobs })

      return NextResponse.json({ data: monthData })
    }

    // 기사: 1단계 — accepted application 조회 (applied_equipment_code 포함)
    const { data: rawApps } = await supabase
      .from('applications')
      .select('job_id, equipment_id, applied_equipment_code')
      .eq('driver_id', user.id)
      .eq('status', 'accepted')

    const jobIds = (rawApps ?? []).map((a) => a.job_id as string).filter(Boolean)

    // 기사: jobs + equipments + 지출을 가능한 범위에서 병렬 조회
    const equipmentIds = (rawApps ?? []).map((a) => a.equipment_id as string).filter(Boolean)

    const [{ data: rawJobs }, { data: rawEquipments }, { data: rawExpenses }] = await Promise.all([
      jobIds.length
        ? supabase
            .from('jobs')
            .select('id, title, location, work_date, pay_amounts, work_days, pay_due_type, status, equipment_codes')
            .in('id', jobIds)
            .gte('work_date', lookbackDate)
            .lte('work_date', endDate)
        : Promise.resolve({ data: [] }),
      equipmentIds.length
        ? supabase
            .from('equipments')
            .select('id, model_code')
            .in('id', equipmentIds)
        : Promise.resolve({ data: [] }),
      supabase
        .from('ledger_expenses')
        .select('id, expense_date, category, memo, amount')
        .eq('driver_id', user.id)
        .gte('expense_date', startDate)
        .lte('expense_date', endDate),
    ])

    const equipmentMap = new Map((rawEquipments ?? []).map((e) => [e.id, e.model_code]))

    // application과 job 매핑
    const jobMap = new Map((rawJobs ?? []).map((j) => [j.id, j]))

    const appsForMonth = (rawApps ?? []).filter((a) => jobMap.has(a.job_id))

    const incomeRaw = appsForMonth.map((a) => ({
      equipment_id: a.equipment_id,
      applied_equipment_code: (a.applied_equipment_code as string | null) ?? null,
      equipments: a.equipment_id && equipmentMap.get(a.equipment_id) ? { model_code: equipmentMap.get(a.equipment_id)! } : null,
      jobs: jobMap.get(a.job_id) ?? null,
    }))

    const allIncomes = buildIncomeEntries(incomeRaw as Parameters<typeof buildIncomeEntries>[0])
    // 생성된 entries 중 이번 달 범위 내 날짜만 포함
    const incomes = allIncomes.filter(e => e.date >= startDate && e.date <= endDate)
    const expenses = buildExpenseEntries(rawExpenses ?? [])
    const monthData = buildMonthData({ year, month, incomes, expenses, jobs: [] })

    return NextResponse.json({ data: monthData })
  } catch (error) {
    console.error('[GET /api/ledger/monthly]', error)
    return NextResponse.json({ error: '장부를 불러오지 못했습니다.' }, { status: 500 })
  }
}
