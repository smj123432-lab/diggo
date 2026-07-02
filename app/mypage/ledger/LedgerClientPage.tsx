// 장부 클라이언트 페이지 — 필터탭(전체/지급대기/지급완료) + 반응형 레이아웃
'use client'

import { useState, useMemo, useRef } from 'react'
import dynamic from 'next/dynamic'
import { toast } from 'sonner'
import type { UserRole, LedgerMonthData, LedgerFilterTab } from '@/types'
import { useLedger, useDeleteExpense } from '@/hooks/useLedger'
import { MonthPicker } from '@/components/features/ledger/MonthPicker'
import { AppNav } from '@/components/features/home/AppNav'

// 무거운 장부 컴포넌트를 lazy load해 초기 JS 번들 감소
const LedgerCalendar = dynamic(() => import('@/components/features/ledger/LedgerCalendar').then(m => ({ default: m.LedgerCalendar })), {
  loading: () => <div className="w-full aspect-[7/6] bg-gray-100 animate-pulse rounded-xl" />,
  ssr: false,
})
const LedgerDayPanel = dynamic(() => import('@/components/features/ledger/LedgerDayPanel').then(m => ({ default: m.LedgerDayPanel })), { ssr: false })
const LedgerMonthSummary = dynamic(() => import('@/components/features/ledger/LedgerMonthSummary').then(m => ({ default: m.LedgerMonthSummary })), { ssr: false })
const AddExpenseModal = dynamic(() => import('@/components/features/ledger/AddExpenseModal').then(m => ({ default: m.AddExpenseModal })), { ssr: false })

interface Props {
  role: UserRole
}

const MONTH_NAMES = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

const FILTER_TABS: { key: LedgerFilterTab; label: string; shortLabel: string }[] = [
  { key: 'all',     label: '전체',    shortLabel: '전체' },
  { key: 'pending', label: '지급 대기', shortLabel: '대기' },
  { key: 'settled', label: '지급 완료', shortLabel: '완료' },
]

const EMPTY_MONTH_DATA: LedgerMonthData = {
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  days: {},
  totalIncome: 0,
  totalIncomeCount: 0,
  pendingIncome: 0,
  settledIncome: 0,
  totalExpense: 0,
  netIncome: 0,
  totalJobCount: 0,
  totalJobPayAmount: 0,
  totalManagerExpense: 0,
  totalManualExpense: 0,
}

export function LedgerClientPage({ role }: Props) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [filterTab, setFilterTab] = useState<LedgerFilterTab>('all')

  const [showMonthPicker, setShowMonthPicker] = useState(false)
  const [pickerYear, setPickerYear] = useState(now.getFullYear())
  const dateButtonRef = useRef<HTMLButtonElement>(null)

  const { data: monthData, isLoading, refetch } = useLedger(year, month)
  const deleteMutation = useDeleteExpense(year, month)

  const displayData: LedgerMonthData = monthData ?? { ...EMPTY_MONTH_DATA, year, month }

  // 필터탭 기반 요약 수치 계산
  const summaryValues = useMemo(() => {
    if (role === 'manager') {
      // 소장: 수익=수동수입, 지출=일당+수동지출
      return {
        income: displayData.totalIncome,
        expense: displayData.totalManagerExpense,
        net: displayData.totalIncome - displayData.totalManagerExpense,
        jobCount: displayData.totalJobCount,
        pendingNote: undefined,
        settledNote: undefined,
      }
    }
    // 기사: 필터탭에 따라 수익 변경
    const income = filterTab === 'pending'
      ? displayData.pendingIncome
      : filterTab === 'settled'
      ? displayData.settledIncome
      : displayData.totalIncome

    const expense = displayData.totalExpense
    return {
      income,
      expense,
      net: income - expense,
      jobCount: displayData.totalIncomeCount,
      pendingNote: filterTab === 'all' ? displayData.pendingIncome : undefined,
      settledNote: filterTab === 'all' ? displayData.settledIncome : undefined,
    }
  }, [role, filterTab, displayData])

  function handlePrevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
    setSelectedDate(null)
  }

  function handleNextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
    setSelectedDate(null)
  }

  function handleDateSelect(dateStr: string) {
    setSelectedDate(prev => prev === dateStr ? null : dateStr)
  }

  async function handleDeleteExpense(id: string) {
    try {
      await deleteMutation.mutateAsync(id)
      toast.success('내역이 삭제되었습니다.')
      if (selectedDate) {
        const dayData = displayData.days[selectedDate]
        if (dayData && dayData.expenses.length <= 1 && dayData.incomes.length === 0 && dayData.jobs.length === 0) {
          setSelectedDate(null)
        }
      }
    } catch {
      toast.error('삭제에 실패했습니다.')
    }
  }

  function handleFilterChange(tab: LedgerFilterTab) {
    setFilterTab(tab)
    setSelectedDate(null)
  }

  const selectedDayData = selectedDate ? (displayData.days[selectedDate] ?? null) : null

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* 상단 네비게이션 바 */}
      <AppNav activeLink="ledger" />

      <div className="pt-16">
        <div className="max-w-5xl mx-auto px-4 py-5">

          {/* 데스크탑: 2열 그리드 / 모바일: 단일 컬럼 */}
          <div className="lg:grid lg:grid-cols-[1fr_280px] lg:gap-5 lg:items-start">

            {/* 좌측: 월 이동 + 필터탭 + 달력 */}
            <div>

              {/* 모바일: 요약 카드 (달력 위) */}
              <div className="lg:hidden mb-4">
                {isLoading
                  ? <div className="bg-white border border-gray-200 rounded-2xl p-4 animate-pulse h-16" />
                  : <LedgerMonthSummary {...summaryValues} />
                }
              </div>

              {/* 월 이동 (좌) + 필터탭 + 내역 추가 (우) */}
              <div className="flex items-center justify-between mb-3 gap-2">
                {/* 월 이동 */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={handlePrevMonth}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    ‹
                  </button>
                  {/* 날짜 텍스트 클릭 → Month Picker */}
                  <button
                    ref={dateButtonRef}
                    onClick={() => {
                      setPickerYear(year)
                      setShowMonthPicker((v) => !v)
                    }}
                    className="px-2 py-1 text-base font-black text-gray-900 whitespace-nowrap rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {year}년 {MONTH_NAMES[month - 1]}
                  </button>
                  <button
                    onClick={handleNextMonth}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    ›
                  </button>
                </div>

                {/* 필터 탭 + 내역 추가 */}
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5 p-1 bg-gray-100 rounded-xl">
                    {FILTER_TABS.map(({ key, label, shortLabel }) => (
                      <button
                        key={key}
                        onClick={() => handleFilterChange(key)}
                        className={`px-2 md:px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                          filterTab === key
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        <span className="hidden md:inline">{label}</span>
                        <span className="md:hidden">{shortLabel}</span>
                      </button>
                    ))}
                  </div>
                  {/* 날짜 선택 시에만 활성화 */}
                  <button
                    onClick={() => selectedDate && setShowAddModal(true)}
                    disabled={!selectedDate}
                    title={selectedDate ? '내역 추가' : '날짜를 먼저 선택해주세요'}
                    className={`text-xs font-semibold px-3 py-2 rounded-xl transition-all whitespace-nowrap shrink-0 ${
                      selectedDate
                        ? 'text-white bg-blue-500 hover:bg-blue-600 cursor-pointer'
                        : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                    }`}
                  >
                    <span className="sm:hidden">+</span>
                    <span className="hidden sm:inline">+ 내역 추가</span>
                  </button>
                </div>
              </div>

              {/* 달력 */}
              {isLoading
                ? <div className="bg-white border border-gray-200 rounded-2xl p-4 animate-pulse h-64" />
                : (
                  <LedgerCalendar
                    monthData={displayData}
                    selectedDate={selectedDate}
                    role={role}
                    filterTab={filterTab}
                    onDateSelect={handleDateSelect}
                  />
                )
              }

              {/* 모바일: 날짜 패널 (달력 아래) */}
              <div className="lg:hidden mt-4">
                <LedgerDayPanel
                  dayData={selectedDayData}
                  role={role}
                  onClose={() => setSelectedDate(null)}
                  onDelete={handleDeleteExpense}
                  onAddExpense={() => setShowAddModal(true)}
                />
              </div>
            </div>

            {/* 우측: 요약 카드 + 날짜 패널 (데스크탑 sticky) */}
            <div className="hidden lg:block space-y-4 sticky top-24 min-w-0 overflow-hidden">
              {isLoading
                ? <div className="bg-white border border-gray-200 rounded-2xl p-4 animate-pulse h-24" />
                : <LedgerMonthSummary {...summaryValues} />
              }
              <LedgerDayPanel
                dayData={selectedDayData}
                role={role}
                onClose={() => setSelectedDate(null)}
                onDelete={handleDeleteExpense}
                onAddExpense={() => setShowAddModal(true)}
              />
            </div>

          </div>
        </div>
      </div>

      {/* Month Picker */}
      {showMonthPicker && (
        <MonthPicker
          currentYear={year}
          currentMonth={month}
          pickerYear={pickerYear}
          onPickerYearChange={setPickerYear}
          onSelect={(y, m) => {
            setYear(y)
            setMonth(m)
            setSelectedDate(null)
          }}
          onClose={() => setShowMonthPicker(false)}
          anchorRect={dateButtonRef.current?.getBoundingClientRect() ?? null}
        />
      )}

      {/* 내역 추가 모달 */}
      {showAddModal && (
        <AddExpenseModal
          defaultDate={selectedDate ?? undefined}
          onClose={() => setShowAddModal(false)}
          onSaved={() => refetch()}
        />
      )}
    </div>
  )
}
