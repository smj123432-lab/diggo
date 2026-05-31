// 장비 코드 배지
import type { EquipmentCode } from '@/types'
import { EQUIPMENT_LABELS } from '@/types'

interface EquipmentBadgeProps {
  code: EquipmentCode
  size?: 'sm' | 'md'
}

const SIZE_CLASS = {
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
}

export function EquipmentBadge({ code, size = 'md' }: EquipmentBadgeProps) {
  return (
    <span className={`bg-blue-500 text-white font-bold rounded-lg ${SIZE_CLASS[size]}`}>
      {EQUIPMENT_LABELS[code]}
    </span>
  )
}
