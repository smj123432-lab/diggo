// components/features/ledger/LedgerDayCell.tsx
// 달력 날짜 셀 — filterTab 기반 순수익 단일 배지 + 위치 표시
'use client'

import type { LedgerDayData, UserRole, LedgerFilterTab } from '@/types'
import { extractDistrict, computeDayNet, formatCellBadge } from '@/lib/utils/ledger'

interface Props {
  day: number
  dateStr: string
  dayData: LedgerDayData | undefined
  isToday: boolean
  isSelected: boolean
  role: UserRole
  filterTab: LedgerFilterTab
  onClick: (dateStr: string) => void
}

export function LedgerDayCell({ day, dateStr, dayData, isToday, isSelected, role, filterTab, onClick }: Props) {
  const net = dayData ? computeDayNet(dayData, role, filterTab) : null

  // 필터 기준으로 이 셀에 표시할 위치 텍스트 결정
  let locationText: string | null = null
  if (dayData) {
    if (role === 'driver') {
      const matchIncomes = filterTab === 'all'
        ? dayData.incomes
        : dayData.incomes.filter(i => filterTab === 'pending' ? i.jobStatus === 'completed' : i.jobStatus === 'settled')
      if (matchIncomes.length > 0 && matchIncomes[0].location) {
        locationText = extractDistrict(matchIncomes[0].location)
      }
    } else {
      const matchJobs = filterTab === 'all'
        ? dayData.jobs
        : dayData.jobs.filter(j => filterTab === 'pending' ? j.jobStatus === 'completed' : j.jobStatus === 'settled')
      if (matchJobs.length > 0 && matchJobs[0].location) {
        locationText = extractDistrict(matchJobs[0].location)
      }
    }
  }

  // 배지 색상: 수익이면 파란색, 손실이면 빨간색
  let badgeClass = ''
  let badgeLabel = ''
  if (net !== null) {
    const isPositive = net > 0
    badgeLabel = formatCellBadge(net)
    badgeClass = isPositive ? 'text-blue-600 bg-blue-50' : 'text-red-500 bg-red-50'

    // 정산대기가 포함된 경우 앰버 톤
    if (net > 0 && role === 'driver' && dayData?.incomes.some(i => i.jobStatus === 'completed') && filterTab === 'all') {
      badgeClass = 'text-amber-600 bg-amber-50'
      badgeLabel = `대기 ${formatCellBadge(net)}`
    }
  }

  return (
    <button
      onClick={() => onClick(dateStr)}
      className={`w-full aspect-square flex flex-col items-center justify-start pt-1 rounded-xl transition-colors
        ${isSelected ? 'bg-blue-50 ring-1 ring-blue-400' : 'hover:bg-gray-50'}
      `}
    >
      {/* 날짜 숫자 */}
      <span
        className={`w-6 h-6 flex items-center justify-center rounded-full font-semibold text-xs shrink-0
          ${isToday ? 'bg-blue-500 text-white' : 'text-gray-700'}
        `}
      >
        {day}
      </span>

      {/* 배지 영역 */}
      <div className="flex flex-col gap-0.5 mt-0.5 w-full px-0.5">
        {locationText && (
          <span className="block w-full text-center text-[9px] font-bold text-slate-400 bg-slate-50 rounded-sm truncate px-0.5">
            {locationText}
          </span>
        )}
        {badgeLabel && (
          <span className={`block w-full text-center text-[9px] font-bold rounded-sm truncate leading-tight px-0.5 ${badgeClass}`}>
            {badgeLabel}
          </span>
        )}
      </div>
    </button>
  )
}
