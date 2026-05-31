// components/features/ledger/LedgerDayItem.tsx
// 내역 한 줄 — 수입/지출/현장 타입별 렌더링 (금액 우측 라인 고정)
import type { LedgerEntry } from '@/types'
import { formatKRW } from '@/lib/utils/ledger'
import { PAY_DUE_LABELS, EQUIPMENT_LABELS } from '@/types'

interface Props {
  entry: LedgerEntry
  onDelete?: (id: string) => void
}

// 금액 고정폭 + 삭제 버튼 고정폭으로 모든 행의 우측 라인 통일
function RightCol({ amount, color, onDelete }: { amount: string; color: string; onDelete?: () => void }) {
  return (
    <div className="flex items-center shrink-0 ml-2">
      <span className={`w-24 text-right text-sm font-bold ${color}`}>{amount}</span>
      <span className="w-8 flex justify-center">
        {onDelete ? (
          <button
            onClick={onDelete}
            className="text-xs text-gray-300 hover:text-red-400 transition-colors"
          >
            삭제
          </button>
        ) : null}
      </span>
    </div>
  )
}

export function LedgerDayItem({ entry, onDelete }: Props) {
  if (entry.type === 'income') {
    const isPending = entry.jobStatus === 'completed'

    return (
      <div className="flex items-center gap-2 py-2.5 border-b border-gray-100 last:border-0">
        <span className="w-7 h-7 flex items-center justify-center bg-blue-50 rounded-lg text-sm shrink-0">
          💰
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-semibold text-gray-900 truncate">{entry.title}</p>
            {isPending && (
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full shrink-0">
                정산대기
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400">
            {entry.equipmentCode ? EQUIPMENT_LABELS[entry.equipmentCode] : ''} · {PAY_DUE_LABELS[entry.payDueType]}
          </p>
        </div>
        <RightCol amount={`+${formatKRW(entry.amount)}`} color="text-blue-600" />
      </div>
    )
  }

  if (entry.type === 'expense') {
    const isManualIncome = entry.category === '수입'

    return (
      <div className="flex items-center gap-2 py-2.5 border-b border-gray-100 last:border-0">
        <span className={`w-7 h-7 flex items-center justify-center rounded-lg text-sm shrink-0 ${isManualIncome ? 'bg-blue-50' : 'bg-red-50'}`}>
          {isManualIncome ? '💰' : '📤'}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {isManualIncome ? '수입 (직접 입력)' : entry.category}
          </p>
          {entry.memo && <p className="text-xs text-gray-400 truncate">{entry.memo}</p>}
        </div>
        <RightCol
          amount={isManualIncome ? `+${formatKRW(entry.amount)}` : `-${formatKRW(entry.amount)}`}
          color={isManualIncome ? 'text-blue-600' : 'text-red-500'}
          onDelete={() => onDelete?.(entry.id)}
        />
      </div>
    )
  }

  // type === 'job' (소장용)
  return (
    <div className="flex items-center gap-2 py-2.5 border-b border-gray-100 last:border-0">
      <span className="w-7 h-7 flex items-center justify-center bg-emerald-50 rounded-lg text-sm shrink-0">
        🏗️
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900 truncate">{entry.title}</p>
        <p className="text-xs text-gray-400 truncate">
          📍 {entry.location} · {entry.equipmentCodes.map(c => EQUIPMENT_LABELS[c]).join(' · ')}
        </p>
      </div>
      <div className="w-32 shrink-0" />
    </div>
  )
}
