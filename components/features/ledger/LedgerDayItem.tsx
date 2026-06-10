// components/features/ledger/LedgerDayItem.tsx
// 내역 한 줄 — 수입/지출/현장 타입별 렌더링
import type { LedgerEntry } from '@/types'
import { formatKRW } from '@/lib/utils/ledger'
import { PAY_DUE_LABELS, EQUIPMENT_LABELS } from '@/types'

interface Props {
  entry: LedgerEntry
  onDelete?: (id: string) => void
}

export function LedgerDayItem({ entry, onDelete }: Props) {
  if (entry.type === 'income') {
    const isPending = entry.jobStatus === 'completed'
    const isSettled = entry.jobStatus === 'settled'

    return (
      <div className="flex items-center gap-2 py-2.5 border-b border-gray-100 last:border-0">
        <span className="w-7 h-7 flex items-center justify-center bg-blue-50 rounded-lg text-sm shrink-0">
          💰
        </span>
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="text-sm font-semibold text-gray-900 truncate">{entry.title}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <p className="text-xs text-gray-400 truncate shrink-0">
              {entry.equipmentCode ? EQUIPMENT_LABELS[entry.equipmentCode] : ''} · {PAY_DUE_LABELS[entry.payDueType]}
            </p>
            {isPending && (
              <span className="text-[10px] font-bold text-amber-500 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full shrink-0">
                정산대기
              </span>
            )}
            {isSettled && (
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full shrink-0">
                정산완료
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center shrink-0">
          <span className={`w-24 text-right text-sm font-bold whitespace-nowrap ${
            isPending ? 'text-amber-500' : 'text-blue-600'
          }`}>
            +{formatKRW(entry.amount)}
          </span>
          <span className="w-8" />
        </div>
      </div>
    )
  }

  if (entry.type === 'expense') {
    const isManualIncome = entry.category === '수입'

    return (
      <div className="flex items-center gap-2 py-2.5 border-b border-gray-100 last:border-0">
        <span className={`w-7 h-7 flex items-center justify-center rounded-lg text-sm shrink-0 ${
          isManualIncome ? 'bg-blue-50' : 'bg-red-50'
        }`}>
          {isManualIncome ? '💰' : '📤'}
        </span>
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {isManualIncome ? '수입 (직접 입력)' : entry.category}
          </p>
          {entry.memo && (
            <p className="text-xs text-gray-400 truncate mt-0.5">{entry.memo}</p>
          )}
        </div>
        <div className="flex items-center shrink-0">
          <span className={`w-24 text-right text-sm font-bold whitespace-nowrap ${
            isManualIncome ? 'text-blue-600' : 'text-red-500'
          }`}>
            {isManualIncome ? '+' : '-'}{formatKRW(entry.amount)}
          </span>
          <span className="w-8 flex justify-center">
            {onDelete && (
              <button
                onClick={() => onDelete(entry.id)}
                className="text-xs text-gray-300 hover:text-red-400 transition-colors"
              >
                삭제
              </button>
            )}
          </span>
        </div>
      </div>
    )
  }

  // type === 'job' (소장용)
  return (
    <div className="flex items-center gap-2 py-2.5 border-b border-gray-100 last:border-0">
      <span className="w-7 h-7 flex items-center justify-center bg-emerald-50 rounded-lg text-sm shrink-0">
        🏗️
      </span>
      <div className="min-w-0 flex-1 overflow-hidden">
        <p className="text-sm font-semibold text-gray-900 truncate">{entry.title}</p>
        <p className="text-xs text-gray-400 truncate mt-0.5">
          📍 {entry.location} · {EQUIPMENT_LABELS[entry.equipmentCode]}
        </p>
      </div>
      <div className="flex items-center shrink-0">
        <span className="w-24 text-right text-sm font-bold text-red-500 whitespace-nowrap">
          {entry.dailyAmount > 0 ? `-${formatKRW(entry.dailyAmount)}` : ''}
        </span>
        <span className="w-8" />
      </div>
    </div>
  )
}
