// components/features/ledger/LedgerDayItem.tsx
// 내역 한 줄 — 수입/지출/현장 타입별 렌더링 (우측 금액 고정폭, 수직 중앙 정렬)
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

        {/* 좌측: 제목 + 장비/지급 + 정산 배지 */}
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

        {/* 우측: 금액 + 빈 자리(삭제 버튼 폭 맞춤) */}
        <div className="flex items-center shrink-0">
          <span className={`w-24 text-right text-sm font-bold whitespace-nowrap ${isPending ? 'text-amber-500' : 'text-blue-600'}`}>
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
        <span className={`w-7 h-7 flex items-center justify-center rounded-lg text-sm shrink-0 ${isManualIncome ? 'bg-blue-50' : 'bg-red-50'}`}>
          {isManualIncome ? '💰' : '📤'}
        </span>

        {/* 좌측: 카테고리 + 메모 */}
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {isManualIncome ? '수입 (직접 입력)' : entry.category}
          </p>
          {entry.memo && <p className="text-xs text-gray-400 truncate mt-0.5">{entry.memo}</p>}
        </div>

        {/* 우측: 금액 + 삭제 버튼 (같은 flex row, items-center 유지) */}
        <div className="flex items-center shrink-0">
          <span className={`w-24 text-right text-sm font-bold whitespace-nowrap ${isManualIncome ? 'text-blue-600' : 'text-red-500'}`}>
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
          📍 {entry.location} · {entry.equipmentCodes.map(c => EQUIPMENT_LABELS[c]).join(' · ')}
        </p>
      </div>
      <div className="flex items-center shrink-0">
        <span className="w-24 text-right text-sm font-bold text-emerald-600 whitespace-nowrap">
          {entry.totalPayAmount > 0 ? `-${formatKRW(entry.totalPayAmount)}` : ''}
        </span>
        <span className="w-8" />
      </div>
    </div>
  )
}
