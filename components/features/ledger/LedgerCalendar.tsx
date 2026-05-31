// components/features/ledger/LedgerCalendar.tsx
// 커스텀 달력 그리드 — 외부 라이브러리 없이 순수 구현
'use client'

import type { LedgerMonthData, UserRole, LedgerFilterTab } from '@/types'
import { getCalendarWeeks } from '@/lib/utils/ledger'
import { LedgerDayCell } from './LedgerDayCell'

interface Props {
  monthData: LedgerMonthData
  selectedDate: string | null
  role: UserRole
  filterTab: LedgerFilterTab
  onDateSelect: (dateStr: string) => void
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export function LedgerCalendar({ monthData, selectedDate, role, filterTab, onDateSelect }: Props) {
  const { year, month, days } = monthData
  const weeks = getCalendarWeeks(year, month)
  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="grid grid-cols-7 border-b border-gray-100">
        {WEEKDAYS.map((d, i) => (
          <div
            key={d}
            className={`py-2 text-center text-xs font-semibold ${
              i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      <div className="p-2 grid gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map((day, di) => {
              if (day === null) return <div key={di} />
              const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              return (
                <LedgerDayCell
                  key={dateStr}
                  day={day}
                  dateStr={dateStr}
                  dayData={days[dateStr]}
                  isToday={dateStr === todayStr}
                  isSelected={dateStr === selectedDate}
                  role={role}
                  filterTab={filterTab}
                  onClick={onDateSelect}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
