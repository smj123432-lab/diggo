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
    return (
      <div className="flex items-start justify-between gap-3 py-2.5 border-b border-gray-100 last:border-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-7 h-7 flex items-center justify-center bg-blue-50 rounded-lg text-sm shrink-0">
            💰
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{entry.title}</p>
            <p className="text-xs text-gray-400">
              {entry.equipmentCode ? EQUIPMENT_LABELS[entry.equipmentCode] : ''} · {PAY_DUE_LABELS[entry.payDueType]}
            </p>
          </div>
        </div>
        <p className="text-sm font-bold text-blue-600 shrink-0">+{formatKRW(entry.amount)}</p>
      </div>
    )
  }

  if (entry.type === 'expense') {
    return (
      <div className="flex items-start justify-between gap-3 py-2.5 border-b border-gray-100 last:border-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-7 h-7 flex items-center justify-center bg-red-50 rounded-lg text-sm shrink-0">
            📤
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{entry.category}</p>
            {entry.memo && <p className="text-xs text-gray-400 truncate">{entry.memo}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <p className="text-sm font-bold text-red-500">-{formatKRW(entry.amount)}</p>
          {onDelete && (
            <button
              onClick={() => onDelete(entry.id)}
              className="text-xs text-gray-300 hover:text-red-400 transition-colors"
            >
              삭제
            </button>
          )}
        </div>
      </div>
    )
  }

  // type === 'job' (소장용)
  return (
    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-2 min-w-0">
        <span className="w-7 h-7 flex items-center justify-center bg-emerald-50 rounded-lg text-sm shrink-0">
          🏗️
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{entry.title}</p>
          <p className="text-xs text-gray-400 truncate">
            📍 {entry.location} · {entry.equipmentCodes.map(c => EQUIPMENT_LABELS[c]).join(' · ')}
          </p>
        </div>
      </div>
    </div>
  )
}
