// components/features/ledger/LedgerDayPanel.tsx
// 날짜 클릭 시 하단에 슬라이드업 표시되는 상세 패널
'use client'

import { AnimatePresence, motion } from 'framer-motion'
import type { LedgerDayData, UserRole } from '@/types'
import { LedgerDayItem } from './LedgerDayItem'
import { formatKRW } from '@/lib/utils/ledger'

interface Props {
  dayData: LedgerDayData | null
  role: UserRole
  onClose: () => void
  onDelete: (id: string) => void
  onAddExpense: () => void
}

export function LedgerDayPanel({ dayData, role, onClose, onDelete, onAddExpense }: Props) {
  const allEntries = dayData
    ? [...dayData.incomes, ...dayData.jobs, ...dayData.expenses]
    : []

  return (
    <AnimatePresence>
      {dayData && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="mt-4 bg-white border border-gray-200 rounded-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div>
              <span className="text-sm font-bold text-gray-900">
                {dayData.date.replace(/-/g, '.')}
              </span>
              {role === 'driver' && (
                <span className="ml-2 text-xs text-gray-400">
                  {dayData.totalIncome > 0 && (
                    <span className="text-blue-500 font-semibold">+{formatKRW(dayData.totalIncome)} </span>
                  )}
                  {dayData.totalExpense > 0 && (
                    <span className="text-red-400 font-semibold">-{formatKRW(dayData.totalExpense)}</span>
                  )}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onAddExpense}
                className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg"
              >
                + 지출 추가
              </button>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">
                ×
              </button>
            </div>
          </div>

          <div className="px-4 max-h-60 overflow-y-auto">
            {allEntries.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">내역이 없습니다.</p>
            ) : (
              allEntries.map((entry, idx) => (
                <LedgerDayItem
                  key={entry.type === 'expense' ? entry.id : `${entry.type}-${idx}`}
                  entry={entry}
                  onDelete={entry.type === 'expense' ? onDelete : undefined}
                />
              ))
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
