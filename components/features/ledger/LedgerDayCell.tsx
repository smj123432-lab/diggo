// components/features/ledger/LedgerDayCell.tsx
// 달력 날짜 셀 — 수입/지출/현장 배지 표시
'use client'

import type { LedgerDayData, UserRole } from '@/types'

interface Props {
  day: number
  dateStr: string
  dayData: LedgerDayData | undefined
  isToday: boolean
  isSelected: boolean
  role: UserRole
  onClick: (dateStr: string) => void
}

export function LedgerDayCell({ day, dateStr, dayData, isToday, isSelected, role, onClick }: Props) {
  const hasIncome = (dayData?.totalIncome ?? 0) > 0
  const hasExpense = (dayData?.totalExpense ?? 0) > 0
  const hasJob = (dayData?.jobs.length ?? 0) > 0

  return (
    <button
      onClick={() => onClick(dateStr)}
      className={`w-full aspect-square flex flex-col items-center justify-start pt-1 rounded-xl transition-colors text-xs relative
        ${isSelected ? 'bg-blue-50 ring-1 ring-blue-400' : 'hover:bg-gray-50'}
      `}
    >
      <span
        className={`w-6 h-6 flex items-center justify-center rounded-full font-semibold
          ${isToday ? 'bg-blue-500 text-white' : 'text-gray-700'}
        `}
      >
        {day}
      </span>

      <div className="flex flex-col gap-0.5 mt-0.5 w-full px-0.5">
        {role === 'driver' && hasIncome && (
          <span className="block w-full text-center text-[10px] font-bold text-blue-600 bg-blue-50 rounded-sm truncate px-0.5">
            +{(dayData!.totalIncome / 10000).toFixed(0)}만
          </span>
        )}
        {hasJob && (
          <span className="block w-full text-center text-[10px] font-bold text-emerald-600 bg-emerald-50 rounded-sm truncate px-0.5">
            현장
          </span>
        )}
        {hasExpense && (
          <span className="block w-full text-center text-[10px] font-bold text-red-500 bg-red-50 rounded-sm truncate px-0.5">
            -{(dayData!.totalExpense / 10000).toFixed(0)}만
          </span>
        )}
      </div>
    </button>
  )
}
