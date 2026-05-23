// 일감 목록 카드 컴포넌트
import Link from 'next/link'
import type { JobWithManager, JobType } from '@/types'
import { EQUIPMENT_LABELS, JOB_TYPE_LABELS, PAY_DUE_LABELS } from '@/types'

interface JobCardProps {
  job: JobWithManager
  isPreferred?: boolean
}

// 일 종류별 배지 색상
const JOB_TYPE_BADGE: Record<JobType, string> = {
  civil: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  demolition: 'bg-orange-50 text-orange-700 border border-orange-200',
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
        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          {/* 장비 코드 — 파란 솔리드 */}
          <span className="bg-blue-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
            {EQUIPMENT_LABELS[job.equipment_code]}
          </span>
          {/* 일 종류 — 토목: 초록 / 철거: 주황 */}
          <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${JOB_TYPE_BADGE[job.job_type]}`}>
            {JOB_TYPE_LABELS[job.job_type]}
          </span>
          {isPreferred && (
            <span className="bg-violet-50 text-violet-600 text-xs font-medium px-2 py-0.5 rounded-full border border-violet-200">
              선호
            </span>
          )}
          <span className="ml-auto text-emerald-500 text-xs font-semibold shrink-0">모집중</span>
        </div>

        {/* 제목 */}
        <h3 className="text-gray-900 font-bold text-sm mb-2 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
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

        {/* 소장 정보 */}
        <div className="flex items-center gap-1.5 mb-3 mt-auto">
          <span className="text-xs font-medium text-gray-700">
            {job.profiles.name} 소장
          </span>
          {job.profiles.is_certified && (
            <span className="inline-flex items-center gap-0.5 bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              인증
            </span>
          )}
          <span className="text-xs text-gray-400 flex items-center gap-0.5">
            <span className="text-yellow-400">★</span>
            {job.profiles.rating_avg.toFixed(1)}
          </span>
        </div>

        {/* 날짜 + 지급 + 가격 */}
        <div className="flex items-end justify-between">
          <div className="text-xs text-gray-400 space-y-0.5">
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {workDate}
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              {PAY_DUE_LABELS[job.pay_due_type]}
            </div>
          </div>
          <div className="text-blue-600 font-black text-lg leading-none">
            {job.pay_amount.toLocaleString()}원
          </div>
        </div>

      </div>
    </Link>
  )
}
