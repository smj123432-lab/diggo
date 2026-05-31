'use client'

// 소장 내 일감 목록 상태 필터 탭
import { useState, useRef, useEffect } from 'react'
import type { JobStatus } from '@/types'

type FilterValue = 'all' | JobStatus

interface Props {
  value: FilterValue
  onChange: (v: FilterValue) => void
  counts: Record<FilterValue, number>
}

const TABS: { value: FilterValue; label: string }[] = [
  { value: 'all',         label: '전체' },
  { value: 'open',        label: '모집중' },
  { value: 'closed',      label: '모집마감' },
  { value: 'in_progress', label: '작업중' },
  { value: 'completed',   label: '작업완료' },
  { value: 'settled',     label: '정산완료' },
]

export function ManagerJobStatusFilter({ value, onChange, counts }: Props) {
  const [scrollState, setScrollState] = useState({ canLeft: false, canRight: true })
  const scrollRef = useRef<HTMLDivElement>(null)

  function handleScroll() {
    const el = scrollRef.current
    if (!el) return
    setScrollState({
      canLeft: el.scrollLeft > 0,
      canRight: el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
    })
  }

  useEffect(() => {
    requestAnimationFrame(handleScroll)
  }, [])

  return (
    <div className="relative flex-1 min-w-0">
      <div
        ref={scrollRef}
        className="overflow-x-auto no-scrollbar"
        onScroll={handleScroll}
      >
        <div className="flex gap-1.5 pb-1 w-max pr-10">
          {TABS.map((tab) => {
            const count = counts[tab.value]
            return (
              <button
                key={tab.value}
                onClick={() => onChange(tab.value)}
                className={`shrink-0 text-xs font-semibold px-3.5 py-1.5 rounded-full transition-colors ${
                  value === tab.value
                    ? 'bg-blue-500 text-white'
                    : 'bg-white border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                {tab.label}{count > 0 ? ` (${count})` : ''}
              </button>
            )
          })}
        </div>
      </div>
      {scrollState.canLeft && (
        <div className="absolute left-0 top-0 bottom-1 flex items-center bg-gradient-to-r from-white via-white/90 to-transparent pr-6">
          <button
            onClick={() => scrollRef.current?.scrollBy({ left: -160, behavior: 'smooth' })}
            aria-label="이전 필터"
            className="w-7 h-7 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm text-gray-500 active:scale-95 transition-transform"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}
      {scrollState.canRight && (
        <div className="absolute right-0 top-0 bottom-1 flex items-center bg-gradient-to-l from-white via-white/90 to-transparent pl-6">
          <button
            onClick={() => scrollRef.current?.scrollBy({ left: 160, behavior: 'smooth' })}
            aria-label="다음 필터"
            className="w-7 h-7 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm text-gray-500 active:scale-95 transition-transform"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
