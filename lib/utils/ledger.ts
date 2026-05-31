import type {
  LedgerIncomeEntry,
  LedgerExpenseEntry,
  LedgerJobEntry,
  LedgerDayData,
  LedgerMonthData,
  EquipmentCode,
  PayDueType,
  JobStatus,
} from '@/types'

/** 금액을 '1,234,000원' 형식으로 포맷 */
export function formatKRW(amount: number): string {
  return amount.toLocaleString('ko-KR') + '원'
}

/** 'YYYY-MM-DD' 문자열 파싱 */
export function parseDate(dateStr: string): { year: number; month: number; day: number } {
  const [year, month, day] = dateStr.split('-').map(Number)
  return { year, month, day }
}

/**
 * 주소에서 구/동/읍/면/리 단위만 추출.
 * "인천 부평동 경인로" → "부평동", "구리 인창동" → "인창동"
 */
export function extractDistrict(location: string): string {
  const match = location.match(/(\S+[동읍면리구])/)
  return match ? match[1] : location.split(' ')[0] ?? location
}

/**
 * 해당 월의 달력 그리드를 주(week) 배열로 반환.
 * null = 이전/다음 달 빈 칸, number = 일(day).
 * 요일: 0=일 ~ 6=토
 */
export function getCalendarWeeks(year: number, month: number): Array<Array<number | null>> {
  const firstDow = new Date(year, month - 1, 1).getDay()
  const lastDate = new Date(year, month, 0).getDate()
  const cells: Array<number | null> = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: lastDate }, (_, i) => i + 1),
  ]
  // null 패딩해서 7의 배수로 맞춤
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks: Array<Array<number | null>> = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }
  return weeks
}

/** applications+jobs raw 데이터 → LedgerIncomeEntry[] */
export function buildIncomeEntries(
  rawApplications: Array<{
    equipment_id: string | null
    equipments: { model_code: EquipmentCode } | null
    jobs: {
      id: string
      title: string
      location: string
      work_date: string
      pay_amounts: Record<string, number>
      pay_due_type: string
      status: string
    } | null
  }>
): LedgerIncomeEntry[] {
  return rawApplications
    .filter((a) => a.jobs !== null)
    .map((a) => {
      const job = a.jobs!
      const eqCode = a.equipments?.model_code ?? null
      const amount = eqCode
        ? (job.pay_amounts[eqCode] ?? Object.values(job.pay_amounts)[0] ?? 0)
        : (Object.values(job.pay_amounts)[0] ?? 0)
      return {
        type: 'income' as const,
        date: job.work_date,
        jobId: job.id,
        title: job.title,
        location: job.location,
        equipmentCode: eqCode,
        amount,
        payDueType: job.pay_due_type as PayDueType,
        jobStatus: job.status as JobStatus,
      }
    })
}

/** jobs raw 데이터 → LedgerJobEntry[] (소장용) */
export function buildJobEntries(
  rawJobs: Array<{
    id: string
    title: string
    work_date: string
    location: string
    equipment_codes: EquipmentCode[]
    pay_amounts: Record<string, number>
  }>
): LedgerJobEntry[] {
  return rawJobs.map((job) => ({
    type: 'job' as const,
    date: job.work_date,
    jobId: job.id,
    title: job.title,
    location: job.location,
    equipmentCodes: job.equipment_codes,
    totalPayAmount: Object.values(job.pay_amounts ?? {}).reduce((s, v) => s + v, 0),
  }))
}

/** ledger_expenses raw 데이터 → LedgerExpenseEntry[] */
export function buildExpenseEntries(
  rawExpenses: Array<{
    id: string
    expense_date: string
    category: string
    memo: string | null
    amount: number
  }>
): LedgerExpenseEntry[] {
  return rawExpenses.map((e) => ({
    type: 'expense' as const,
    date: e.expense_date,
    id: e.id,
    category: e.category,
    memo: e.memo,
    amount: e.amount,
  }))
}

/** 수입+지출+현장 항목을 날짜별로 병합해 LedgerMonthData 반환 */
export function buildMonthData(params: {
  year: number
  month: number
  incomes: LedgerIncomeEntry[]
  expenses: LedgerExpenseEntry[]
  jobs: LedgerJobEntry[]
}): LedgerMonthData {
  const { year, month, incomes, expenses, jobs } = params
  const days: Record<string, LedgerDayData> = {}

  function getOrCreate(date: string): LedgerDayData {
    if (!days[date]) {
      days[date] = {
        date,
        incomes: [],
        expenses: [],
        jobs: [],
        totalIncome: 0,
        totalExpense: 0,
      }
    }
    return days[date]
  }

  for (const entry of incomes) {
    const day = getOrCreate(entry.date)
    day.incomes.push(entry)
    day.totalIncome += entry.amount
  }
  for (const entry of expenses) {
    const day = getOrCreate(entry.date)
    day.expenses.push(entry)
    day.totalExpense += entry.amount
  }
  for (const entry of jobs) {
    getOrCreate(entry.date).jobs.push(entry)
  }

  const totalIncome = incomes.reduce((s, e) => s + e.amount, 0)
  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0)
  // 정산대기: job.status === 'completed', 정산완료: 나머지(settled 등)
  const pendingIncome = incomes
    .filter((e) => e.jobStatus === 'completed')
    .reduce((s, e) => s + e.amount, 0)

  return {
    year,
    month,
    days,
    totalIncome,
    pendingIncome,
    settledIncome: totalIncome - pendingIncome,
    totalExpense,
    netIncome: totalIncome - totalExpense,
    totalJobCount: new Set(jobs.map((j) => j.jobId)).size,
    totalManualExpense: totalExpense,
  }
}
