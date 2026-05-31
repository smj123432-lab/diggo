// components/features/ledger/LedgerDayCell.tsx
// 달력 날짜 셀 — 순수익 단일 배지 (정산대기/완료 색상 구분) + 위치 표시
'use client'

import type { LedgerDayData, UserRole } from '@/types'
import { extractDistrict } from '@/lib/utils/ledger'

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
  const net = (dayData?.totalIncome ?? 0) - (dayData?.totalExpense ?? 0)
  const hasJob = (dayData?.jobs.length ?? 0) > 0
  const firstJobLocation = hasJob ? dayData!.jobs[0].location : null

  // 기사: 정산대기(completed) 여부 판별
  const hasPending = (dayData?.incomes ?? []).some((i) => i.jobStatus === 'completed')
  const allPending = hasPending && (dayData?.incomes ?? []).every((i) => i.jobStatus === 'completed')

  // 순수익 배지 컬러 결정
  let badgeClass = ''
  let badgeLabel = ''

  if (net !== 0) {
    const prefix = net > 0 ? '+' : ''
    const value = `${prefix}${(net / 10000).toFixed(0)}만`

    if (net > 0 && hasPending) {
      // 정산대기 포함: 주황/연한 앰버 톤
      badgeClass = 'text-amber-600 bg-amber-50'
      badgeLabel = `대기 ${value}`
    } else if (net > 0) {
      // 정산완료: 파란색
      badgeClass = 'text-blue-600 bg-blue-50'
      badgeLabel = value
    } else {
      // 마이너스: 빨간색
      badgeClass = 'text-red-500 bg-red-50'
      badgeLabel = value
    }
  }

  return (
    <button
      onClick={() => onClick(dateStr)}
      className={`w-full aspect-square flex flex-col items-center justify-start pt-1 rounded-xl transition-colors text-xs relative
        ${isSelected ? 'bg-blue-50 ring-1 ring-blue-400' : 'hover:bg-gray-50'}
      `}
    >
      {/* 날짜 숫자 */}
      <span
        className={`w-6 h-6 flex items-center justify-center rounded-full font-semibold shrink-0
          ${isToday ? 'bg-blue-500 text-white' : 'text-gray-700'}
        `}
      >
        {day}
      </span>

      {/* 배지 영역 */}
      <div className="flex flex-col gap-0.5 mt-0.5 w-full px-0.5">
        {/* 소장: 현장 위치 + 일당 */}
        {role === 'manager' && hasJob && (
          <>
            {firstJobLocation && (
              <span className="block w-full text-center text-[9px] font-bold text-emerald-600 bg-emerald-50 rounded-sm truncate px-0.5">
                {extractDistrict(firstJobLocation)}
              </span>
            )}
            {(() => {
              const totalPay = dayData!.jobs.reduce((s, j) => s + j.totalPayAmount, 0)
              return totalPay > 0 ? (
                <span className="block w-full text-center text-[10px] font-bold text-emerald-700 bg-emerald-50 rounded-sm truncate px-0.5">
                  -{(totalPay / 10000).toFixed(0)}만
                </span>
              ) : null
            })()}
          </>
        )}

        {/* 기사: 현장 위치 (수입 내역 기준) */}
        {role === 'driver' && (dayData?.incomes.length ?? 0) > 0 && dayData!.incomes[0].location && (
          <span className="block w-full text-center text-[9px] font-bold text-slate-400 bg-slate-50 rounded-sm truncate px-0.5">
            {extractDistrict(dayData!.incomes[0].location)}
          </span>
        )}

        {/* 순수익 단일 배지 */}
        {badgeLabel && (
          <span className={`block w-full text-center text-[10px] font-bold rounded-sm truncate px-0.5 ${badgeClass}`}>
            {badgeLabel}
          </span>
        )}
      </div>
    </button>
  )
}
