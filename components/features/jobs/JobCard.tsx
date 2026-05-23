// 일감 목록 카드 컴포넌트 — 라이트 테마 2열 그리드용
import Link from 'next/link'
import type { JobWithManager } from '@/types'
import { EQUIPMENT_LABELS, JOB_TYPE_LABELS, PAY_DUE_LABELS } from '@/types'

interface JobCardProps {
  job: JobWithManager
  isPreferred?: boolean
}

export function JobCard({ job, isPreferred }: JobCardProps) {
  const workDate = new Date(job.work_date).toLocaleDateString('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  })

  return (
    <Link href={`/jobs/${job.id}`} className="block h-full">
      <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-md transition-all group cursor-pointer h-full flex flex-col">
        {/* 배지 행 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="bg-blue-50 text-blue-600 text-xs font-semibold px-2.5 py-1 rounded-lg border border-blue-100">
              {EQUIPMENT_LABELS[job.equipment_code]}
            </span>
            <span className="text-gray-400 text-xs">{JOB_TYPE_LABELS[job.job_type]}</span>
            {isPreferred && (
              <span className="bg-emerald-50 text-emerald-600 text-xs px-2 py-0.5 rounded-full border border-emerald-100">
                선호
              </span>
            )}
          </div>
          <span className="text-emerald-500 text-xs font-semibold shrink-0">모집중</span>
        </div>

        {/* 제목 */}
        <h3 className="text-gray-900 font-bold text-sm mb-2 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug flex-1">
          {job.title}
        </h3>

        {/* 위치 */}
        <p className="text-gray-400 text-xs mb-4 flex items-center gap-1 truncate">
          <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {job.location}
        </p>

        {/* 하단 정보 */}
        <div className="flex items-end justify-between mt-auto">
          <div className="text-xs text-gray-400 space-y-0.5">
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {workDate}
            </div>
            <div>{PAY_DUE_LABELS[job.pay_due_type]}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400 mb-0.5">
              <span className="text-yellow-400">★</span> {job.profiles.rating_avg.toFixed(1)}
              {job.profiles.is_certified && <span className="text-blue-500 ml-1 font-bold">✓</span>}
            </div>
            <div className="text-blue-600 font-black text-lg leading-none">
              {job.pay_amount.toLocaleString()}원
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
