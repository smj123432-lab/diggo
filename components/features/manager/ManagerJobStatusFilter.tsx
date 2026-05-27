'use client'

// 소장 내 일감 목록 상태 필터 탭
import type { JobStatus } from '@/types'

type FilterValue = 'all' | JobStatus

interface Props {
  value: FilterValue
  onChange: (v: FilterValue) => void
}

const TABS: { value: FilterValue; label: string }[] = [
  { value: 'all',         label: '전체' },
  { value: 'open',        label: '모집중' },
  { value: 'closed',      label: '마감' },
  { value: 'in_progress', label: '작업중' },
  { value: 'completed',   label: '완료' },
  { value: 'settled',     label: '정산' },
]

export function ManagerJobStatusFilter({ value, onChange }: Props) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`shrink-0 text-xs font-semibold px-3.5 py-1.5 rounded-full transition-colors ${
            value === tab.value
              ? 'bg-blue-500 text-white'
              : 'bg-white border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
