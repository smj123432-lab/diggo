// 장부 클라이언트 페이지 — 달력, 월 요약, 날짜 패널, 지출 추가 모달 통합
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import type { UserRole, LedgerMonthData } from '@/types'
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

const EMPTY_MONTH_DATA: LedgerMonthData = {
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  days: {},
  totalIncome: 0,
  totalExpense: 0,
  netIncome: 0,
  totalJobCount: 0,
  totalManualExpense: 0,
}

export function LedgerClientPage({ role }: Props) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  const { data: monthData, isLoading, refetch } = useLedger(year, month)
  const deleteMutation = useDeleteExpense(year, month)

  const displayData: LedgerMonthData = monthData ?? { ...EMPTY_MONTH_DATA, year, month }

  function handlePrevMonth() {
    if (month === 1) {
      setYear((y) => y - 1)
      setMonth(12)
    } else {
      setMonth((m) => m - 1)
    }
    setSelectedDate(null)
  }

  function handleNextMonth() {
    if (month === 12) {
      setYear((y) => y + 1)
      setMonth(1)
    } else {
      setMonth((m) => m + 1)
    }
    setSelectedDate(null)
  }

  function handleDateSelect(dateStr: string) {
    setSelectedDate((prev) => (prev === dateStr ? null : dateStr))
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

      {/* 본문 */}
      <div className="pt-16">
        <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
          {/* 월 이동 헤더 + 내역 추가 버튼 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrevMonth}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                ‹
              </button>
              <h1 className="text-lg font-black text-gray-900">
                {year}년 {MONTH_NAMES[month - 1]}
              </h1>
              <button
                onClick={handleNextMonth}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                ›
              </button>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 px-3 py-1.5 rounded-xl transition-colors"
            >
              + 내역 추가
            </button>
          </div>

          {/* 월 요약 카드 */}
          {isLoading ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-4 animate-pulse h-16" />
          ) : (
            <LedgerMonthSummary
              totalIncome={displayData.totalIncome}
              totalExpense={displayData.totalExpense}
              netIncome={displayData.netIncome}
              totalJobCount={displayData.totalJobCount}
              role={role}
            />
          )}

          {/* 달력 */}
          {isLoading ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-4 animate-pulse h-64" />
          ) : (
            <LedgerCalendar
              monthData={displayData}
              selectedDate={selectedDate}
              role={role}
              onDateSelect={handleDateSelect}
            />
          )}

          {/* 날짜 상세 패널 */}
          <LedgerDayPanel
            dayData={selectedDayData}
            role={role}
            onClose={() => setSelectedDate(null)}
            onDelete={handleDeleteExpense}
            onAddExpense={() => setShowAddModal(true)}
          />
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
