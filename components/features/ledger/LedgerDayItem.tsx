// components/features/ledger/LedgerDayItem.tsx
// 내역 한 줄 — 수입/지출/현장 타입별 렌더링 (금액 우측 라인 고정)
import type { LedgerEntry } from '@/types'
import { formatKRW } from '@/lib/utils/ledger'
import { PAY_DUE_LABELS, EQUIPMENT_LABELS } from '@/types'

interface Props {
  entry: LedgerEntry
  onDelete?: (id: string) => void
}

export function LedgerDayItem({ entry, onDelete }: Props) {
  if (entry.type === 'income') {
    // completed = 정산대기, settled = 정산완료, 나머지(in_progress) = 작업중
    const isPending = entry.jobStatus === 'completed'
    const isSettled = entry.jobStatus === 'settled'

    return (
      <div className="flex items-center gap-2 py-2.5 border-b border-gray-100 last:border-0">
        <span className="w-7 h-7 flex items-center justify-center bg-blue-50 rounded-lg text-sm shrink-0">
          💰
        </span>

        {/* 좌측: 제목 + 장비/지급 정보 + 정산 상태 배지 */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 truncate">{entry.title}</p>
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-xs text-gray-400">
              {entry.equipmentCode ? EQUIPMENT_LABELS[entry.equipmentCode] : ''} · {PAY_DUE_LABELS[entry.payDueType]}
            </p>
            {isPending && (
              <span className="text-[10px] font-bold text-amber-500 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                정산대기
              </span>
            )}
            {isSettled && (
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                정산완료
              </span>
            )}
          </div>
        </div>

        {/* 우측: 금액 + 삭제 자리 */}
        <div className="flex items-center shrink-0 ml-1">
          <span className={`w-24 text-right text-sm font-bold ${isPending ? 'text-amber-500' : 'text-blue-600'}`}>
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
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {isManualIncome ? '수입 (직접 입력)' : entry.category}
          </p>
          {entry.memo && <p className="text-xs text-gray-400 truncate">{entry.memo}</p>}
        </div>

        {/* 우측: 배지 자리 + 금액 + 삭제 버튼 */}
        <div className="flex flex-col items-end shrink-0 ml-1">
          {/* 지출은 배지 없음 — 수입과 높이 맞추기 위한 빈 공간 없음 */}
          <div className="flex items-center">
            <span className={`w-24 text-right text-sm font-bold ${isManualIncome ? 'text-blue-600' : 'text-red-500'}`}>
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
      {/* 일당 금액 */}
      <div className="flex items-center shrink-0 ml-1">
        <span className="w-24 text-right text-sm font-bold text-emerald-600">
          {entry.totalPayAmount > 0 ? `-${formatKRW(entry.totalPayAmount)}` : ''}
        </span>
        <span className="w-8" />
      </div>
    </div>
  )
}
