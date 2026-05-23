// 일감 목록 카드 컴포넌트
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
    <Link href={`/jobs/${job.id}`}>
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 hover:border-blue-500/50 hover:bg-slate-800 transition-all group cursor-pointer">
        {/* 상단 배지 행 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-blue-500/20 text-blue-400 text-xs font-mono px-2.5 py-1 rounded-lg border border-blue-500/30">
              {EQUIPMENT_LABELS[job.equipment_code]}
            </span>
            <span className="text-slate-400 text-xs">{JOB_TYPE_LABELS[job.job_type]}</span>
            {isPreferred && (
              <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2 py-0.5 rounded-full border border-emerald-500/20">
                선호
              </span>
            )}
          </div>
          <span className="text-emerald-400 text-xs font-medium shrink-0">모집중</span>
        </div>

        {/* 제목 */}
        <h3 className="text-white font-semibold text-base mb-2 group-hover:text-blue-300 transition-colors line-clamp-2 leading-snug">
          {job.title}
        </h3>

        {/* 위치 */}
        <p className="text-slate-400 text-sm mb-4 flex items-center gap-1.5 truncate">
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {job.location}
        </p>

        {/* 하단 정보 행 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-slate-500 text-xs">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {workDate}
            </span>
            <span className="text-slate-600">|</span>
            <span>{PAY_DUE_LABELS[job.pay_due_type]}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <span className="text-yellow-400">★</span>
              <span>{job.profiles.rating_avg.toFixed(1)}</span>
              {job.profiles.is_certified && (
                <span className="text-blue-400 font-bold">✓</span>
              )}
            </div>
            <span className="text-white font-bold text-base">
              {job.pay_amount.toLocaleString()}원
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
