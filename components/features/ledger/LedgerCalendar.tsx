// components/features/ledger/LedgerCalendar.tsx
// 구글 캘린더 스타일 달력 — 날짜 칸 내 리본 일체감, 100px+ 칸 높이
'use client'

import { useMemo, useState, useEffect } from 'react'
import type {
  LedgerMonthData,
  UserRole,
  LedgerFilterTab,
  EquipmentCode,
  JobStatus,
  LedgerJobEntry,
  LedgerIncomeEntry,
} from '@/types'
import { getCalendarWeeks, extractDistrict } from '@/lib/utils/ledger'

interface RibbonSegment {
  key: string
  jobId: string
  equipmentCode: EquipmentCode | null  // expense는 null
  dailyAmount: number
  totalWorkDays: number
  location: string
  colStart: number   // 1~7
  colSpan: number
  isStart: boolean
  isEnd: boolean
  lane: number
  jobStatus: JobStatus | null  // expense는 null
  entryType: 'job' | 'income' | 'expense'
  expenseIsIncome?: boolean    // '수입' 카테고리 여부
}

function assignLanes(segments: RibbonSegment[]): void {
  segments.sort((a, b) => a.colStart - b.colStart)
  const laneEnds: number[] = []
  for (const seg of segments) {
    let lane = laneEnds.findIndex(end => end < seg.colStart)
    if (lane === -1) { lane = laneEnds.length; laneEnds.push(0) }
    laneEnds[lane] = seg.colStart + seg.colSpan - 1
    seg.lane = lane
  }
}

// 파스텔 리본 배경·전경색 (라이트 테마)
const RIBBON_BG: Record<EquipmentCode, string> = {
  '008': '#ede9fe',
  '017': '#cffafe',
  '035': '#fce7f3',
  '02':  '#fef9c3',
  '3w':  '#fee2e2',
  '6w':  '#d1fae5',
  '8w':  '#ffedd5',
  '10t': '#e0e7ff',
}
const RIBBON_FG: Record<EquipmentCode, string> = {
  '008': '#5b21b6',
  '017': '#0e7490',
  '035': '#9d174d',
  '02':  '#713f12',
  '3w':  '#991b1b',
  '6w':  '#065f46',
  '8w':  '#9a3412',
  '10t': '#3730a3',
}

// 레인 간격 (고정)
const RIBBON_LANE_G = 2

// 반응형 상수 — 모바일 vs 데스크탑
// 모바일: p-1(4) + h-6(24) + 4 = 32px
// 데스크탑: p-2(8) + h-7(28) + 4 = 40px
const R = {
  mobile:  { top: 32, h: 14, cellMin: 80  },
  desktop: { top: 40, h: 18, cellMin: 100 },
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

interface Props {
  monthData: LedgerMonthData
  selectedDate: string | null
  role: UserRole
  filterTab: LedgerFilterTab
  onDateSelect: (dateStr: string) => void
}

type AnyEntry = LedgerJobEntry | LedgerIncomeEntry

export function LedgerCalendar({
  monthData, selectedDate, role, filterTab, onDateSelect,
}: Props) {
  const { year, month, days } = monthData
  const weeks = getCalendarWeeks(year, month)
  const todayStr = new Date().toISOString().split('T')[0]

  // 모바일 감지 (SSR safe — 초기값 false로 hydration 안전)
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const rv = isMobile ? R.mobile : R.desktop

  // 주(Week)별 리본 세그먼트 계산
  const weekRibbons = useMemo(() => {
    return weeks.map(week => {
      type SpanAccum = {
        jobId: string
        equipmentCode: EquipmentCode | null
        dailyAmount: number
        totalWorkDays: number
        location: string
        jobStatus: JobStatus
        colStart: number
        colEnd: number
        isStart: boolean
        lastIsEnd: boolean
      }
      const spanMap = new Map<string, SpanAccum>()

      week.forEach((day, di) => {
        if (!day) return
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        const dayData = days[dateStr]
        if (!dayData) return

        const rawEntries = (
          role === 'manager' ? dayData.jobs : dayData.incomes
        ) as AnyEntry[]

        const entries: AnyEntry[] = filterTab === 'all'
          ? rawEntries
          : rawEntries.filter(e =>
              filterTab === 'pending' ? e.jobStatus === 'completed' : e.jobStatus === 'settled'
            )

        for (const entry of entries) {
          const eqCode = entry.equipmentCode as EquipmentCode | null
          // equipmentCode 없어도 jobId로 그룹화해 리본 표시
          const key = eqCode ? `${entry.jobId}-${eqCode}` : entry.jobId
          const col = di + 1
          const amount = 'dailyAmount' in entry ? entry.dailyAmount : entry.amount

          if (!spanMap.has(key)) {
            spanMap.set(key, {
              jobId: entry.jobId,
              equipmentCode: eqCode,
              dailyAmount: Number(amount) || 0,
              totalWorkDays: entry.totalWorkDays,
              location: entry.location,
              jobStatus: entry.jobStatus,
              colStart: col,
              colEnd: col,
              isStart: entry.dayIndex === 1,
              lastIsEnd: entry.dayIndex === entry.totalWorkDays,
            })
          } else {
            const s = spanMap.get(key)!
            s.colEnd = col
            s.lastIsEnd = entry.dayIndex === entry.totalWorkDays
          }
        }
      })

      const segments: RibbonSegment[] = Array.from(spanMap.entries()).map(([key, s]) => ({
        key,
        jobId: s.jobId,
        equipmentCode: s.equipmentCode,
        dailyAmount: s.dailyAmount,
        totalWorkDays: s.totalWorkDays,
        location: s.location,
        colStart: s.colStart,
        colSpan: s.colEnd - s.colStart + 1,
        isStart: s.isStart,
        isEnd: s.lastIsEnd,
        lane: 0,
        jobStatus: s.jobStatus,
        entryType: role === 'manager' ? 'job' : 'income',
      }))

      // 수동 수입/지출 리본 (단일 칸, 날짜별)
      week.forEach((day, di) => {
        if (!day) return
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        const dayData = days[dateStr]
        if (!dayData?.expenses.length) return

        for (const expense of dayData.expenses) {
          const isIncome = expense.category === '수입'
          const amtStr = expense.amount >= 10_000
            ? `${Math.round(expense.amount / 10_000)}만`
            : expense.amount.toLocaleString()
          const sign = isIncome ? '+' : '-'
          const label = `${expense.memo ?? expense.category} ${sign}${amtStr}`
          segments.push({
            key: `expense-${expense.id}`,
            jobId: expense.id,
            equipmentCode: null,
            dailyAmount: expense.amount,
            totalWorkDays: 1,
            location: label,
            colStart: di + 1,
            colSpan: 1,
            isStart: true,
            isEnd: true,
            lane: 0,
            jobStatus: null,
            entryType: 'expense',
            expenseIsIncome: isIncome,
          })
        }
      })

      assignLanes(segments)
      return segments
    })
  }, [weeks, days, role, filterTab, year, month])

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden select-none">

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {WEEKDAYS.map((d, i) => (
          <div
            key={d}
            className={`py-2 md:py-2.5 text-center text-[10px] md:text-[11px] font-semibold md:tracking-wide ${
              i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* 주(Week) 목록 — divide로 행 구분선 */}
      <div className="divide-y divide-gray-100">
        {weeks.map((week, wi) => {
          const segs = weekRibbons[wi]
          const maxLane = segs.length > 0 ? Math.max(...segs.map(s => s.lane)) : -1
          const ribbonTotalH = maxLane >= 0
            ? rv.top + (maxLane + 1) * (rv.h + RIBBON_LANE_G) + 12
            : 0
          const weekMinH = Math.max(rv.cellMin, ribbonTotalH)

          return (
            <div key={wi} className="relative" style={{ minHeight: weekMinH }}>

              {/* ── Layer 1: 날짜 칸 배경 + 클릭 (absolute inset-0) ── */}
              <div className="absolute inset-0 grid grid-cols-7 divide-x divide-gray-50">
                {week.map((day, di) => {
                  // 이번 달 범위 밖 (빈 칸)
                  if (!day) {
                    return <div key={di} className="bg-gray-50/40" />
                  }

                  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  const isToday    = dateStr === todayStr
                  const isSelected = dateStr === selectedDate
                  const isSun = di === 0
                  const isSat = di === 6

                  return (
                    <button
                      key={dateStr}
                      onClick={() => onDateSelect(dateStr)}
                      className={`w-full h-full flex flex-col items-start transition-colors text-left p-1 md:p-2 ${
                        isSelected
                          ? 'bg-blue-50 ring-1 ring-inset ring-blue-200'
                          : 'hover:bg-gray-50/80'
                      }`}
                    >
                      {/* 날짜 숫자 — 좌측 상단, 모바일에서 더 작게 */}
                      <span
                        className={`flex items-center justify-center rounded-full font-bold shrink-0 w-6 h-6 text-[10px] md:w-7 md:h-7 md:text-xs ${
                          isToday
                            ? 'bg-blue-500 text-white'
                            : isSelected
                            ? 'text-blue-600 font-extrabold'
                            : isSun
                            ? 'text-red-400'
                            : isSat
                            ? 'text-blue-400'
                            : 'text-gray-700'
                        }`}
                      >
                        {day}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* ── Layer 2: 리본 바 오버레이 (pointer-events-none) ── */}
              {maxLane >= 0 && (
                <div
                  className="absolute inset-x-0 pointer-events-none"
                  style={{ top: rv.top }}
                >
                  {Array.from({ length: maxLane + 1 }, (_, laneIdx) => {
                    const laneSegs = segs.filter(s => s.lane === laneIdx)
                    return (
                      <div
                        key={laneIdx}
                        className="grid grid-cols-7"
                        style={{
                          height: rv.h,
                          marginBottom: laneIdx < maxLane ? RIBBON_LANE_G : 0,
                        }}
                      >
                        {laneSegs.map(seg => {
                          let bg: string, fg: string, label: string

                          if (seg.entryType === 'expense') {
                            bg = seg.expenseIsIncome ? '#d1fae5' : '#fee2e2'
                            fg = seg.expenseIsIncome ? '#065f46' : '#991b1b'
                            label = seg.location
                          } else {
                            bg = (seg.equipmentCode ? RIBBON_BG[seg.equipmentCode] : null) ?? '#e0e7ff'
                            fg = (seg.equipmentCode ? RIBBON_FG[seg.equipmentCode] : null) ?? '#3730a3'
                            const totalCost = Math.abs(Number(seg.dailyAmount) || 0) * seg.totalWorkDays
                            const sign      = role === 'manager' ? '-' : '+'
                            const amtStr    = totalCost >= 10_000
                              ? `${Math.round(totalCost / 10_000)}만`
                              : totalCost.toLocaleString()
                            const eqLabel   = seg.equipmentCode ?? '일감'
                            // 모바일: [008] -225만 / 데스크탑: [008 동작구] 총 -225만
                            if (isMobile) {
                              label = `[${eqLabel}] ${sign}${amtStr}`
                            } else {
                              const dist = extractDistrict(seg.location)
                              label = `[${eqLabel} ${dist}] 총 ${sign}${amtStr}`
                            }
                          }

                          return (
                            <div
                              key={seg.key}
                              className="flex items-center overflow-hidden"
                              style={{
                                gridColumn: `${seg.colStart} / span ${seg.colSpan}`,
                                backgroundColor: bg,
                                borderTopLeftRadius:     seg.isStart ? (isMobile ? 3 : 4) : 0,
                                borderBottomLeftRadius:  seg.isStart ? (isMobile ? 3 : 4) : 0,
                                borderTopRightRadius:    seg.isEnd   ? (isMobile ? 3 : 4) : 0,
                                borderBottomRightRadius: seg.isEnd   ? (isMobile ? 3 : 4) : 0,
                                paddingLeft:  seg.isStart ? (isMobile ? 3 : 6) : (isMobile ? 1 : 2),
                                paddingRight: seg.isEnd   ? (isMobile ? 3 : 6) : (isMobile ? 1 : 2),
                                marginLeft:   seg.isStart ? (isMobile ? 1 : 2) : 0,
                                marginRight:  seg.isEnd   ? (isMobile ? 1 : 2) : 0,
                              }}
                            >
                              <span
                                className="font-semibold truncate whitespace-nowrap leading-none text-[8px] md:text-[9px]"
                                style={{ color: fg }}
                              >
                                {label}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              )}

            </div>
          )
        })}
      </div>
    </div>
  )
}
