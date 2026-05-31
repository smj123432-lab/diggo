// components/features/ledger/LedgerMonthSummary.tsx
// 월 요약 카드 — 수익 / 지출 / 총 수익 (기사·소장 공통 포맷)
import { formatKRW } from '@/lib/utils/ledger'
import type { UserRole } from '@/types'

interface Props {
  totalIncome: number
  totalIncomeCount: number
  pendingIncome: number
  settledIncome: number
  totalExpense: number
  netIncome: number
  totalJobCount: number
  totalJobPayAmount: number
  totalManagerExpense: number
  role: UserRole
}

export function LedgerMonthSummary({
  totalIncome,
  totalIncomeCount,
  pendingIncome,
  settledIncome,
  totalExpense,
  netIncome,
  totalJobCount,
  totalJobPayAmount,
  totalManagerExpense,
  role,
}: Props) {
  if (role === 'manager') {
    // 소장: 수익=0(미구현), 지출=일당+수동, 총 수익=-(지출)
    const managerNet = -totalManagerExpense
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-0.5">수익</p>
            <p className="text-base font-black text-blue-600">0원</p>
          </div>
          <div className="text-center border-x border-gray-100">
            <p className="text-xs text-gray-400 mb-0.5">지출</p>
            <p className="text-base font-black text-red-500">{formatKRW(totalManagerExpense)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-0.5">총 수익</p>
            <p className={`text-base font-black ${managerNet >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
              {managerNet === 0 ? '0원' : `-${formatKRW(totalManagerExpense)}`}
            </p>
          </div>
        </div>
        {totalJobCount > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              이달 현장
            </span>
            <span className="text-xs font-bold text-gray-500">{totalJobCount}건</span>
          </div>
        )}
      </div>
    )
  }

  // 기사: 수익 / 지출 / 총 수익
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4">
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-0.5">수익</p>
          <p className="text-base font-black text-blue-600">{formatKRW(totalIncome)}</p>
        </div>
        <div className="text-center border-x border-gray-100">
          <p className="text-xs text-gray-400 mb-0.5">지출</p>
          <p className="text-base font-black text-red-500">{formatKRW(totalExpense)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-0.5">총 수익</p>
          <p className={`text-base font-black ${netIncome >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
            {formatKRW(netIncome)}
          </p>
        </div>
      </div>

      {/* 이달 현장 건수 */}
      {totalIncomeCount > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
            이달 현장
          </span>
          <span className="text-xs font-bold text-gray-500">{totalIncomeCount}건</span>
        </div>
      )}

      {/* 정산대기 */}
      {pendingIncome > 0 && (
        <div className="mt-1.5 flex items-center justify-between">
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
