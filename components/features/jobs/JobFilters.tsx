'use client'

// 일감 목록 필터 — 장비 코드, 일감 유형 선택
import type { EquipmentCode, JobType } from '@/types'
import { EQUIPMENT_LABELS, JOB_TYPE_LABELS } from '@/types'

interface JobFiltersProps {
  equipmentCode: EquipmentCode | ''
  jobType: JobType | ''
  onEquipmentChange: (code: EquipmentCode | '') => void
  onJobTypeChange: (type: JobType | '') => void
}

const EQUIPMENT_CODES: EquipmentCode[] = ['008', '017', '035', '02', '3w', '6w', '8w', '10t']
const JOB_TYPES: JobType[] = ['civil', 'demolition']

export function JobFilters({ equipmentCode, jobType, onEquipmentChange, onJobTypeChange }: JobFiltersProps) {
  return (
    <div className="sticky top-16 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 pt-3 pb-2">
      {/* 장비 필터 — 가로 스크롤 */}
      <div className="overflow-x-auto no-scrollbar">
        <div className="flex gap-2 pb-2 w-max">
          <button
            onClick={() => onEquipmentChange('')}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              equipmentCode === ''
                ? 'bg-blue-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            전체 장비
          </button>
          {EQUIPMENT_CODES.map((code) => (
            <button
              key={code}
              onClick={() => onEquipmentChange(code === equipmentCode ? '' : code)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-mono font-medium transition-all ${
                equipmentCode === code
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {EQUIPMENT_LABELS[code]}
            </button>
          ))}
        </div>
      </div>

      {/* 일감 유형 필터 */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onJobTypeChange('')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
            jobType === ''
              ? 'bg-slate-700 text-white'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          전체
        </button>
        {JOB_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => onJobTypeChange(type === jobType ? '' : type)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              jobType === type
                ? 'bg-slate-700 text-white'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {JOB_TYPE_LABELS[type]}
          </button>
        ))}
      </div>
    </div>
  )
}
