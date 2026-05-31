// 장부 클라이언트 페이지 — 필터탭(전체/지급대기/지급완료) + 반응형 레이아웃
'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import type { UserRole, LedgerMonthData, LedgerFilterTab } from '@/types'
import { useLedger, useDeleteExpense } from '@/hooks/useLedger'
import { LedgerCalendar } from '@/components/features/ledger/LedgerCalendar'
import { LedgerDayPanel } from '@/components/features/ledger/LedgerDayPanel'
import { LedgerMonthSummary } from '@/components/features/ledger/LedgerMonthSummary'
import { AddExpenseModal } from '@/components/features/ledger/AddExpenseModal'
import { ExcavatorIcon } from '@/components/ui/ExcavatorIcon'
import { NavButtons } from '@/components/features/home/NavButtons'
import { NavRoleLink } from '@/components/features/home/NavRoleLink'

interface Props {
  role: UserRole
}

const MONTH_NAMES = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

const FILTER_TABS: { key: LedgerFilterTab; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'pending', label: '지급 대기' },
  { key: 'settled', label: '지급 완료' },
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

  const { data: monthData, isLoading, refetch } = useLedger(year, month)
  const deleteMutation = useDeleteExpense(year, month)

  const displayData: LedgerMonthData = monthData ?? { ...EMPTY_MONTH_DATA, year, month }

  // 필터탭 기반 요약 수치 계산
  const summaryValues = useMemo(() => {
    if (role === 'manager') {
      // 소장: 수익=0, 지출=일당+수동지출
      return {
        income: 0,
        expense: displayData.totalManagerExpense,
        net: -displayData.totalManagerExpense,
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
    <div className="min-h-screen bg-gray-50">
      {/* 상단 네비게이션 바 */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/10 bg-slate-900/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <ExcavatorIcon className="w-10 h-8 text-blue-400" />
            <span className="text-lg font-black tracking-tight text-white">
              Diggo<span className="text-blue-400">.</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-1">
            <Link href="/jobs" className="px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
              일감 찾기
            </Link>
            <Link href="/mypage/ledger" className="px-4 py-2 text-sm text-white bg-white/10 rounded-lg font-semibold">
              장부
            </Link>
            <NavRoleLink />
          </div>
          <NavButtons />
        </div>
      </nav>

      <div className="pt-16">
        <div className="max-w-5xl mx-auto px-4 py-5">

          {/* 페이지 타이틀 + 내역 추가 버튼 */}
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-xl font-black text-gray-900">내 장부</h1>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-xl transition-colors"
            >
              + 내역 추가
            </button>
          </div>

          {/* 데스크탑: 2열 그리드 / 모바일: 단일 컬럼 */}
          <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-6 lg:items-start">

            {/* 좌측: 월 이동 + 필터탭 + 달력 */}
            <div>

              {/* 모바일: 요약 카드 (달력 위) */}
              <div className="lg:hidden mb-4">
                {isLoading
                  ? <div className="bg-white border border-gray-200 rounded-2xl p-4 animate-pulse h-16" />
                  : <LedgerMonthSummary {...summaryValues} />
                }
              </div>

              {/* 월 이동 (좌) + 필터탭 (우) */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevMonth}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    ‹
                  </button>
                  <span className="text-base font-black text-gray-900">
                    {year}년 {MONTH_NAMES[month - 1]}
                  </span>
                  <button
                    onClick={handleNextMonth}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    ›
                  </button>
                </div>

                {/* 필터 탭 */}
                <div className="flex gap-0.5 p-1 bg-gray-100 rounded-xl">
                  {FILTER_TABS.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => handleFilterChange(key)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                        filterTab === key
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
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
            <div className="hidden lg:block space-y-4 sticky top-24">
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

      {/* 내역 추가 모달 */}
      {showAddModal && (
        <AddExpenseModal
          defaultDate={selectedDate ?? undefined}
          year={year}
          month={month}
          onClose={() => setShowAddModal(false)}
          onSaved={() => refetch()}
        />
      )}
    </div>
  )
}
