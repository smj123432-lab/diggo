'use client'

// 일감 목록 사이드바 필터 — 장비 코드, 일감 유형 다중 선택
import type { EquipmentCode, JobType } from '@/types'
import { EQUIPMENT_LABELS, JOB_TYPE_LABELS, EQUIPMENT_CODES_LIST, JOB_TYPES_LIST } from '@/types'
import type { JobFilters } from '@/hooks/useJobs'

interface JobFiltersProps {
  filters: JobFilters
  onChange: (filters: JobFilters) => void
}


export function JobFilters({ filters, onChange }: JobFiltersProps) {
  const toggleEquipment = (code: EquipmentCode) => {
    const next = filters.equipment_codes.includes(code)
      ? filters.equipment_codes.filter((c) => c !== code)
      : [...filters.equipment_codes, code]
    onChange({ ...filters, equipment_codes: next })
  }

  const toggleJobType = (type: JobType) => {
    const next = filters.job_types.includes(type)
      ? filters.job_types.filter((t) => t !== type)
      : [...filters.job_types, type]
    onChange({ ...filters, job_types: next })
  }

  const hasActiveFilters =
    filters.equipment_codes.length > 0 || filters.job_types.length > 0

  return (
    <aside className="w-44 shrink-0">
      <div className="sticky top-24 bg-white border border-gray-200 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-bold text-gray-900">필터</span>
          {hasActiveFilters && (
            <button
              onClick={() => onChange({ equipment_codes: [], job_types: [] })}
              className="text-xs text-blue-500 hover:text-blue-700 transition-colors"
            >
              초기화
            </button>
          )}
        </div>

        {/* 장비 */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">장비</p>
          <div className="space-y-2">
            {EQUIPMENT_CODES_LIST.map((code) => {
              const checked = filters.equipment_codes.includes(code)
              return (
                <label key={code} className="flex items-center gap-2 cursor-pointer group">
                  <div
                    onClick={() => toggleEquipment(code)}
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all shrink-0 ${
                      checked
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-gray-300 group-hover:border-blue-400'
                    }`}
                  >
                    {checked && (
                      <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                        <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span
                    onClick={() => toggleEquipment(code)}
                    className={`text-xs transition-colors ${
                      checked ? 'text-gray-900 font-semibold' : 'text-gray-500 group-hover:text-gray-700'
                    }`}
                  >
                    {EQUIPMENT_LABELS[code]}
                  </span>
                </label>
              )
            })}
          </div>
        </div>

        {/* 구분선 */}
        <hr className="border-gray-100 mb-5" />

        {/* 일감 유형 */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">유형</p>
          <div className="space-y-2">
            {JOB_TYPES_LIST.map((type) => {
              const checked = filters.job_types.includes(type)
              return (
                <label key={type} className="flex items-center gap-2 cursor-pointer group">
                  <div
                    onClick={() => toggleJobType(type)}
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all shrink-0 ${
                      checked
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-gray-300 group-hover:border-blue-400'
                    }`}
                  >
                    {checked && (
                      <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                        <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span
                    onClick={() => toggleJobType(type)}
                    className={`text-xs transition-colors ${
                      checked ? 'text-gray-900 font-semibold' : 'text-gray-500 group-hover:text-gray-700'
                    }`}
                  >
                    {JOB_TYPE_LABELS[type]}
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      </div>
    </aside>
  )
}
