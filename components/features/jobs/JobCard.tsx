'use client'

// 일감 목록 카드 컴포넌트
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { JobWithManager, JobType, JobStatus, EquipmentCode } from '@/types'
import { EQUIPMENT_LABELS, JOB_TYPE_LABELS, PAY_DUE_LABELS, WORK_DURATION_LABELS } from '@/types'
import { getTodayStr, formatWorkDate } from '@/lib/utils/date'
import { formatKRW } from '@/lib/utils/ledger'
import { Avatar } from '@/components/ui/Avatar'
import { CertBadge } from '@/components/ui/CertBadge'
import { EquipmentBadge } from '@/components/ui/EquipmentBadge'
import { RatingDisplay } from '@/components/ui/RatingDisplay'

interface JobCardProps {
  job: JobWithManager
  isPreferred?: boolean
}

// 일감 상태 배지
const STATUS_BADGE: Record<JobStatus, { label: string; className: string }> = {
  open:        { label: '모집중',    className: 'text-emerald-600' },
  closed:      { label: '마감',      className: 'text-gray-400' },
  in_progress: { label: '작업중',    className: 'text-blue-500' },
  completed:   { label: '작업완료',  className: 'text-slate-600' },
  settled:     { label: '정산완료',  className: 'text-emerald-600' },
}

// 일 종류별 배지 색상
const JOB_TYPE_BADGE: Record<JobType, string> = {
  civil: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  demolition: 'bg-orange-50 text-orange-700 border border-orange-200',
}

export function JobCard({ job, isPreferred }: JobCardProps) {
  const router = useRouter()
  const workDate = formatWorkDate(job.work_date)

  // work_date가 오늘 이전이면 open → closed 처리
  const today = getTodayStr()
  const effectiveStatus: JobStatus = job.status === 'open' && job.work_date < today ? 'closed' : job.status
  const status = STATUS_BADGE[effectiveStatus]
  const isClosed = effectiveStatus !== 'open'

  return (
    <div
      className={`block h-full ${isClosed ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      onClick={isClosed ? undefined : () => router.push(`/jobs/${job.id}`)}
    >
      <div className={`bg-white border rounded-2xl p-5 transition-all h-full flex flex-col ${
        isClosed
          ? 'border-gray-100 opacity-60'
          : 'border-gray-200 hover:border-blue-300 hover:shadow-md group'
      }`}>

        {/* 배지 행 */}
        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          {/* 장비 코드 — 파란 솔리드 (복수 표시) */}
          {(job.equipment_codes as EquipmentCode[]).map((code) => (
            <EquipmentBadge key={code} code={code} />
          ))}
          {/* 일 종류 — 토목: 초록 / 철거: 주황 */}
          <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${JOB_TYPE_BADGE[job.job_type]}`}>
            {JOB_TYPE_LABELS[job.job_type]}
          </span>
          {isPreferred && (
            <span className="relative group/preferred inline-flex">
              <span className="text-yellow-400 text-sm font-bold cursor-default">★</span>
              <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap rounded-lg bg-gray-800 px-2.5 py-1 text-xs text-white opacity-0 group-hover/preferred:opacity-100 transition-opacity duration-150 shadow-md z-10">
                내 선호 정보와 일치하는 일감
                <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
              </span>
            </span>
          )}
          <span className={`ml-auto text-xs font-semibold shrink-0 ${status.className}`}>{status.label}</span>
        </div>

        {/* 제목 */}
        <h3 className="text-gray-900 font-bold text-sm mb-2 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
          {job.title}
        </h3>

        {/* 위치 */}
        <p className="text-gray-400 text-xs mb-1 flex items-center gap-1 truncate">
          <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {job.location}
        </p>

        {/* 날짜 + 지급일 */}
        <div className="text-xs text-gray-400 mb-3">
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {workDate}
            {job.work_duration && (
              <><span className="text-gray-300">·</span>{WORK_DURATION_LABELS[job.work_duration]}</>
            )}
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            {PAY_DUE_LABELS[job.pay_due_type]}
          </div>
        </div>

        {/* 소장 정보 + 가격 */}
        <div className="flex items-center justify-between mt-auto">
          {/* 소장 프로필 링크 — 카드 클릭과 독립적으로 동작 */}
          <Link
            href={`/profiles/${job.profiles.id}`}
            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <Avatar src={job.profiles.avatar_url} name={job.profiles.name} size="sm" />
            <span className="text-xs font-medium text-gray-700">
              {job.profiles.name} 소장
            </span>
            {job.profiles.review_count >= 5 && job.profiles.rating_avg >= 4.5 && <CertBadge variant="top" />}
            {job.profiles.review_count >= 5 && job.profiles.rating_avg <= 2.0 && <CertBadge variant="low" />}
            {(job.profiles.penalty_count ?? 0) > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600">
                패널티 {job.profiles.penalty_count}
              </span>
            )}
            <span className="text-gray-300 text-xs mx-0.5">|</span>
            <RatingDisplay value={job.profiles.rating_avg} className="text-xs text-gray-400" />
          </Link>
          <div className="flex flex-col items-end gap-0.5 shrink-0">
            {(job.equipment_codes as EquipmentCode[]).map(code => (
              <div key={code} className="flex items-baseline gap-1">
                <span className="text-xs text-gray-400">{EQUIPMENT_LABELS[code]}</span>
                <span className="text-blue-600 font-black text-base leading-none">
                  {formatKRW((job.pay_amounts as Record<string, number>)[code] ?? 0)}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
