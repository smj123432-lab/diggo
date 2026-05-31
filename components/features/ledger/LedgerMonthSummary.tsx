// components/features/ledger/LedgerMonthSummary.tsx
// 월 요약 카드 (총수입 / 총지출 / 순수익 + 정산대기 표시)
import { formatKRW } from '@/lib/utils/ledger'
import type { UserRole } from '@/types'

interface Props {
  totalIncome: number
  pendingIncome: number
  settledIncome: number
  totalExpense: number
  netIncome: number
  totalJobCount: number
  totalJobPayAmount: number
  role: UserRole
}

export function LedgerMonthSummary({
  totalIncome,
  pendingIncome,
  settledIncome,
  totalExpense,
  netIncome,
  totalJobCount,
  totalJobPayAmount,
  role,
}: Props) {
  if (role === 'manager') {
    const totalManagerExpense = totalJobPayAmount + totalExpense
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-0.5">이달 현장</p>
            <p className="text-lg font-black text-gray-900">{totalJobCount}건</p>
          </div>
          <div className="text-center border-x border-gray-100">
            <p className="text-xs text-gray-400 mb-0.5">일당 지출</p>
            <p className="text-base font-black text-emerald-600">{formatKRW(totalJobPayAmount)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-0.5">총 지출</p>
            <p className="text-base font-black text-red-500">{formatKRW(totalManagerExpense)}</p>
          </div>
        </div>
        {totalExpense > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-400 font-semibold">수동 지출 포함</span>
            <span className="text-xs font-bold text-gray-500">{formatKRW(totalExpense)}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4">
      {/* 3열 요약 */}
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-0.5">수입</p>
          <p className="text-base font-black text-blue-600">{formatKRW(totalIncome)}</p>
        </div>
        <div className="text-center border-x border-gray-100">
          <p className="text-xs text-gray-400 mb-0.5">지출</p>
          <p className="text-base font-black text-red-500">{formatKRW(totalExpense)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-0.5">순수익</p>
          <p className={`text-base font-black ${netIncome >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
            {formatKRW(netIncome)}
          </p>
        </div>
      </div>

      {/* 정산대기 금액 표시 (있을 때만) */}
      {pendingIncome > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-amber-500 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
            정산대기
          </span>
          <span className="text-xs font-bold text-amber-500">{formatKRW(pendingIncome)}</span>
        </div>
      )}
      {settledIncome > 0 && pendingIncome > 0 && (
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            정산완료
          </span>
          <span className="text-xs font-bold text-emerald-600">{formatKRW(settledIncome)}</span>
        </div>
      )}
    </div>
  )
}
