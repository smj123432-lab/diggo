// components/features/ledger/LedgerDayPanel.tsx
// 날짜 클릭 상세 패널 — 헤더(날짜+버튼), 리스트, 총 수익 푸터
'use client'

import { AnimatePresence, motion } from 'framer-motion'
import type { LedgerDayData, UserRole } from '@/types'
import { LedgerDayItem } from './LedgerDayItem'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatKRW } from '@/lib/utils/ledger'

interface Props {
  dayData: LedgerDayData | null
  role: UserRole
  onClose: () => void
  onDelete: (id: string) => void
  onAddExpense: () => void
}

function computePanelNet(dayData: LedgerDayData, role: UserRole): number {
  const jobIncome = dayData.incomes.reduce((s, i) => s + (Number(i.amount) || 0), 0)
  const manualInc = dayData.expenses
    .filter(e => e.category === '수입')
    .reduce((s, e) => s + (Number(e.amount) || 0), 0)
  const actualExp = dayData.expenses
    .filter(e => e.category !== '수입')
    .reduce((s, e) => s + (Number(e.amount) || 0), 0)
  const jobPay = dayData.jobs.reduce((s, j) => s + (Number(j.dailyAmount) || 0), 0)

  const raw = role === 'manager'
    ? manualInc - jobPay - actualExp
    : jobIncome + manualInc - actualExp

  // -0 → 0 방지 (-0 은 falsy)
  return raw || 0
}

export function LedgerDayPanel({ dayData, role, onClose, onDelete, onAddExpense }: Props) {
  const allEntries = dayData
    ? [...dayData.incomes, ...dayData.jobs, ...dayData.expenses]
    : []

  const dayNet = dayData ? computePanelNet(dayData, role) : 0

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
          {/* 헤더: 날짜 + 버튼 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-bold text-gray-900 shrink-0">
              {dayData.date.replace(/-/g, '.')}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onAddExpense}
                className="text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors"
              >
                + 내역 추가
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none transition-colors"
              >
                ×
              </button>
            </div>
          </div>

          {/* 내역 리스트 */}
          <div className="px-4 max-h-64 overflow-y-auto">
            {allEntries.length === 0 ? (
              <EmptyState title="내역이 없습니다." className="py-6" />
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

          {/* 푸터: 이 날의 총 수익 */}
          {allEntries.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/60">
              <span className="text-xs font-semibold text-gray-400">이 날의 총 수익</span>
              <span className={`text-sm font-black whitespace-nowrap ${
                dayNet > 0 ? 'text-blue-600' : dayNet < 0 ? 'text-red-600' : 'text-gray-400'
              }`}>
                {dayNet > 0 ? '+' : ''}{formatKRW(dayNet)}
              </span>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
