'use client'

// 일감 상세 — 장비별 배차 현황 배지 (모집중 + 다중 장비일 때 표시)
import type { EquipmentCode } from '@/types'
import { EQUIPMENT_LABELS } from '@/types'

interface Props {
  equipmentCodes: EquipmentCode[]
  dispatchedCodes: Record<string, boolean>
}

export function EquipmentDispatchBadges({ equipmentCodes, dispatchedCodes }: Props) {
  return (
    <div className="bg-gray-50 rounded-xl border border-gray-100 px-3 py-2.5">
      <p className="text-xs text-gray-400 font-medium mb-2">장비별 배차 현황</p>
      <div className="flex flex-col gap-1.5">
        {equipmentCodes.map((code) => {
          const isDispatched = dispatchedCodes[code] ?? false
          return (
            <div key={code} className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700">
                {EQUIPMENT_LABELS[code]} ({code})
              </span>
              {isDispatched ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  배차완료
                </span>
              ) : (
                <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                  모집중
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
