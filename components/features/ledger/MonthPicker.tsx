// components/features/ledger/MonthPicker.tsx
// 연/월 직접 이동 드롭다운 — createPortal + getBoundingClientRect 패턴
'use client'

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  currentYear: number
  currentMonth: number
  pickerYear: number
  onPickerYearChange: (y: number) => void
  onSelect: (year: number, month: number) => void
  onClose: () => void
  anchorRect: DOMRect | null
}

const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

export function MonthPicker({
  currentYear,
  currentMonth,
  pickerYear,
  onPickerYearChange,
  onSelect,
  onClose,
  anchorRect,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null)

  // 바깥 클릭 닫기
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    // mousedown을 사용해야 옵션 클릭이 닫힘보다 먼저 처리되지 않음
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  // Esc 닫기
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  if (!anchorRect) return null

  const top = anchorRect.bottom + window.scrollY + 6
  const left = anchorRect.left + window.scrollX

  return createPortal(
    <div
      ref={panelRef}
      style={{ position: 'absolute', top, left, zIndex: 9999 }}
      className="bg-white border border-gray-200 rounded-2xl shadow-xl p-4 w-64"
    >
      {/* 연도 이동 */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => onPickerYearChange(pickerYear - 1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
        >
          ‹
        </button>
        <span className="text-sm font-black text-gray-900">{pickerYear}년</span>
        <button
          onClick={() => onPickerYearChange(pickerYear + 1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
        >
          ›
        </button>
      </div>

      {/* 월 그리드 */}
      <div className="grid grid-cols-4 gap-1.5">
        {MONTHS.map((label, i) => {
          const m = i + 1
          const isActive = pickerYear === currentYear && m === currentMonth
          return (
            <button
              key={m}
              onClick={() => {
                onSelect(pickerYear, m)
                onClose()
              }}
              className={`py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>,
    document.body
  )
}
