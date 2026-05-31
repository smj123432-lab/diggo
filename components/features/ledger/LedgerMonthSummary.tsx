// components/features/ledger/LedgerMonthSummary.tsx
// 월 요약 카드 — 수익 / 지출 / 총 수익 (필터탭 연동 값을 받아 표시)
import { formatKRWCompact } from '@/lib/utils/ledger'

interface Props {
  income: number
  expense: number
  net: number
  jobCount?: number
  pendingNote?: number
  settledNote?: number
}

export function LedgerMonthSummary({ income, expense, net, jobCount, pendingNote, settledNote }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4">
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center min-w-0 overflow-hidden">
          <p className="text-xs text-gray-400 mb-0.5">수익</p>
          <p className="text-sm font-black text-blue-600 whitespace-nowrap truncate">{formatKRWCompact(income)}</p>
        </div>
        <div className="text-center border-x border-gray-100 min-w-0 overflow-hidden">
          <p className="text-xs text-gray-400 mb-0.5">지출</p>
          <p className="text-sm font-black text-red-500 whitespace-nowrap truncate">{formatKRWCompact(expense)}</p>
        </div>
        <div className="text-center min-w-0 overflow-hidden">
          <p className="text-xs text-gray-400 mb-0.5">총 수익</p>
          <p className={`text-sm font-black whitespace-nowrap truncate ${net >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
            {formatKRWCompact(net)}
          </p>
        </div>
      </div>

      {/* 이달 현장 건수 */}
      {jobCount !== undefined && jobCount > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
            이달 현장
          </span>
          <span className="text-xs font-bold text-gray-500">{jobCount}건</span>
        </div>
      )}

      {/* 정산대기 */}
      {pendingNote !== undefined && pendingNote > 0 && (
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-xs text-amber-500 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
            정산대기
          </span>
          <span className="text-xs font-bold text-amber-500">{formatKRWCompact(pendingNote)}</span>
        </div>
      )}

      {/* 정산완료 (정산대기도 있을 때만) */}
      {settledNote !== undefined && settledNote > 0 && pendingNote !== undefined && pendingNote > 0 && (
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            정산완료
          </span>
          <span className="text-xs font-bold text-emerald-600">{formatKRWCompact(settledNote)}</span>
        </div>
      )}
    </div>
  )
}
