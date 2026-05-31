// components/features/ledger/LedgerMonthSummary.tsx
// 월 요약 카드 (총수입 / 총지출 / 순수익)
import { formatKRW } from '@/lib/utils/ledger'
import type { UserRole } from '@/types'

interface Props {
  totalIncome: number
  totalExpense: number
  netIncome: number
  totalJobCount: number
  role: UserRole
}

export function LedgerMonthSummary({ totalIncome, totalExpense, netIncome, totalJobCount, role }: Props) {
  if (role === 'manager') {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-4 grid grid-cols-2 gap-3">
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-0.5">이달 현장</p>
          <p className="text-lg font-black text-gray-900">{totalJobCount}건</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-0.5">수동 지출</p>
          <p className="text-lg font-black text-red-500">{formatKRW(totalExpense)}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 grid grid-cols-3 gap-2">
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
  )
}
