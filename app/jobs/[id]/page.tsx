// 일감 상세 — ISR 1분
export const revalidate = 60

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { JobApplyButton } from '@/components/features/jobs/JobApplyButton'
import { KakaoMap } from '@/components/features/jobs/KakaoMap'
import { CopyButton } from '@/components/ui/CopyButton'
import {
  EQUIPMENT_LABELS,
  JOB_TYPE_LABELS,
  PAY_DUE_LABELS,
  WORK_DURATION_LABELS,
} from '@/types'
import type { JobType, JobStatus, ApplicationStatus, EquipmentCode, WorkDuration, PayDueType } from '@/types'

interface Props {
  params: { id: string }
}

const STATUS_BADGE: Record<JobStatus, { label: string; className: string }> = {
  open:        { label: '모집중', className: 'bg-emerald-100 text-emerald-700' },
  closed:      { label: '마감',   className: 'bg-gray-100 text-gray-500' },
  in_progress: { label: '작업중', className: 'bg-blue-100 text-blue-700' },
  completed:   { label: '완료',   className: 'bg-purple-100 text-purple-700' },
}

const JOB_TYPE_BADGE: Record<JobType, string> = {
  civil:      'bg-emerald-50 text-emerald-700 border border-emerald-200',
  demolition: 'bg-orange-50 text-orange-700 border border-orange-200',
}

export default async function JobDetailPage({ params }: Props) {
  const supabase = await createClient()

  const { data: job, error } = await supabase
    .from('jobs')
    .select('*, profiles(id, name, rating_avg, is_certified)')
    .eq('id', params.id)
    .single()

  if (error || !job) notFound()

  const { data: { user } } = await supabase.auth.getUser()

  let userRole: string | null = null
  let existingApplication: { id: string; status: ApplicationStatus } | null = null

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    userRole = profile?.role ?? null

    if (userRole === 'driver') {
      const { data: application } = await supabase
        .from('applications')
        .select('id, status')
        .eq('job_id', params.id)
        .eq('driver_id', user.id)
        .maybeSingle()

      existingApplication = application ?? null
    }
  }

  const isOwnJob = user?.id === job.manager_id
  const workDate = new Date(job.work_date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
  const status = STATUS_BADGE[job.status as JobStatus]
  const showApplyBar = !isOwnJob && userRole !== 'manager'

  return (
    <main className="min-h-screen bg-gray-50 pb-24 lg:pb-8">

      {/* 헤더 */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 py-3 flex items-center gap-3">
          <Link
            href="/jobs"
            className="p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <span className="text-sm font-semibold text-gray-700">일감 상세</span>
        </div>
      </div>

      {/* 본문 */}
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-5">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8 lg:items-start">

          {/* ── 좌측 (col-span-2) ── */}
          <div className="col-span-2 space-y-4">

            {/* 뱃지 + 제목 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center gap-1.5 flex-wrap mb-3">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${status.className}`}>
                  {status.label}
                </span>
                <span className="bg-brand-blue text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                  {EQUIPMENT_LABELS[job.equipment_code as EquipmentCode]}
                </span>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${JOB_TYPE_BADGE[job.job_type as JobType]}`}>
                  {JOB_TYPE_LABELS[job.job_type as JobType]}
                </span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 leading-snug">{job.title}</h1>
            </div>

            {/* 소장 정보 — 모바일 전용 (데스크톱은 우측 카드) */}
            <div className="lg:hidden bg-white rounded-2xl border border-gray-200 p-5">
              <ManagerBlock job={job} />
            </div>

            {/* 작업 위치 + 지도 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <p className="text-xs text-gray-400 font-medium mb-3">작업 위치</p>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div className="flex items-center">
                  <p className="text-sm font-semibold text-gray-800">{job.location}</p>
                  <CopyButton text={job.location} />
                </div>
              </div>
              {job.latitude && job.longitude && (
                <KakaoMap
                  latitude={job.latitude}
                  longitude={job.longitude}
                  label={job.location}
                />
              )}
            </div>

            {/* 작업 일자 / 지급 정보 — 모바일 전용 (데스크톱은 우측 카드) */}
            <div className="lg:hidden bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
              <p className="text-xs text-gray-400 font-medium">작업 정보</p>
              <MetaRow
                icon={<CalendarIcon />}
                label="작업일자"
                value={workDate}
                sub={job.work_duration ? WORK_DURATION_LABELS[job.work_duration as WorkDuration] : undefined}
              />
              <MetaRow
                icon={<MoneyIcon />}
                label="지급 금액"
                value={`${job.pay_amount.toLocaleString()}원`}
                sub={PAY_DUE_LABELS[job.pay_due_type as PayDueType]}
                valueClass="text-lg font-black text-brand-blue-dark"
              />
            </div>

            {/* 상세 내용 */}
            {job.description && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <p className="text-xs text-gray-400 font-medium mb-2">상세 내용</p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{job.description}</p>
              </div>
            )}

            {/* 철거 추가 정보 */}
            {job.job_type === 'demolition' && (job.attachments || job.caution) && (
              <div className="bg-orange-50 rounded-2xl border border-orange-200 p-5 space-y-3">
                <p className="text-xs text-orange-600 font-semibold">철거 추가 정보</p>
                {job.attachments && (
                  <div>
                    <p className="text-xs text-orange-400 mb-1">필요 어태치먼트</p>
                    <p className="text-sm text-orange-800 font-medium">{job.attachments}</p>
                  </div>
                )}
                {job.caution && (
                  <div>
                    <p className="text-xs text-orange-400 mb-1">주의사항</p>
                    <p className="text-sm text-orange-800 leading-relaxed">{job.caution}</p>
                  </div>
                )}
              </div>
            )}

            {/* 소장 본인 일감 관리 링크 — 모바일 */}
            {isOwnJob && (
              <Link
                href="/manager/jobs"
                className="lg:hidden block w-full text-center bg-white border border-gray-200 text-gray-700 font-semibold py-3.5 rounded-2xl hover:bg-gray-50 transition-colors text-sm"
              >
                내 일감 관리 →
              </Link>
            )}
          </div>

          {/* ── 우측 퀵 카드 (데스크톱 전용) ── */}
          <div className="hidden lg:block col-span-1">
            <div className="lg:sticky lg:top-24 space-y-3">
              <div className="bg-white rounded-2xl border border-gray-200 p-6">

                {/* 금액 */}
                <div className="mb-5">
                  <p className="text-xs text-gray-400 mb-1">지급 금액</p>
                  <p className="text-3xl font-black text-brand-blue-dark leading-tight">
                    {job.pay_amount.toLocaleString()}
                    <span className="text-lg font-bold ml-1">원</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{PAY_DUE_LABELS[job.pay_due_type as PayDueType]}</p>
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-3 mb-5">
                  {/* 작업일자 */}
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 mt-0.5">
                      <CalendarIcon />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">작업일자</p>
                      <p className="text-sm font-semibold text-gray-800">{workDate}</p>
                      {job.work_duration && (
                        <p className="text-xs text-gray-400 mt-0.5">{WORK_DURATION_LABELS[job.work_duration as WorkDuration]}</p>
                      )}
                    </div>
                  </div>

                  {/* 장비 */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                      <ExcavatorIcon />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">필요 장비</p>
                      <p className="text-sm font-semibold text-gray-800">{EQUIPMENT_LABELS[job.equipment_code as EquipmentCode]}</p>
                    </div>
                  </div>
                </div>

                {/* 소장 정보 */}
                <div className="border-t border-gray-100 pt-4 mb-5">
                  <p className="text-xs text-gray-400 mb-2.5">소장 정보</p>
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm shrink-0">
                      {job.profiles.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-gray-800">{job.profiles.name} 소장</span>
                        {job.profiles.is_certified && (
                          <span className="inline-flex items-center justify-center bg-brand-blue text-white w-4 h-4 rounded-full shrink-0">
                            <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-yellow-400 text-xs">★</span>
                        <span className="text-xs text-gray-500">{job.profiles.rating_avg.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 지원 버튼 */}
                {showApplyBar && (
                  <JobApplyButton
                    jobId={job.id}
                    jobStatus={job.status as JobStatus}
                    userRole={userRole}
                    existingApplication={existingApplication}
                  />
                )}

                {/* 소장 본인 일감 관리 링크 */}
                {isOwnJob && (
                  <Link
                    href="/manager/jobs"
                    className="block w-full text-center bg-gray-50 border border-gray-200 text-gray-700 font-semibold py-3.5 rounded-2xl hover:bg-gray-100 transition-colors text-sm"
                  >
                    내 일감 관리 →
                  </Link>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 모바일 고정 하단 지원 버튼 */}
      {showApplyBar && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-gray-200 px-4 py-4 z-20">
          <div className="max-w-lg mx-auto">
            <JobApplyButton
              jobId={job.id}
              jobStatus={job.status as JobStatus}
              userRole={userRole}
              existingApplication={existingApplication}
            />
          </div>
        </div>
      )}

    </main>
  )
}

/* ── 공유 서브컴포넌트 ── */

function ManagerBlock({ job }: { job: { profiles: { name: string; is_certified: boolean; rating_avg: number } } }) {
  return (
    <>
      <p className="text-xs text-gray-400 font-medium mb-3">소장 정보</p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm shrink-0">
          {job.profiles.name.charAt(0)}
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-gray-800">{job.profiles.name} 소장</span>
            {job.profiles.is_certified && (
              <span className="inline-flex items-center justify-center bg-brand-blue text-white w-4 h-4 rounded-full shrink-0">
                <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-yellow-400 text-xs">★</span>
            <span className="text-xs text-gray-500">{job.profiles.rating_avg.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </>
  )
}

interface MetaRowProps {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  valueClass?: string
}

function MetaRow({ icon, label, value, sub, valueClass }: MetaRowProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className={`text-sm font-semibold text-gray-800 mt-0.5 ${valueClass ?? ''}`}>
          {value}
          {sub && <span className="text-gray-400 font-normal ml-1.5">· {sub}</span>}
        </p>
      </div>
    </div>
  )
}

function CalendarIcon() {
  return (
    <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function MoneyIcon() {
  return (
    <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )
}

function ExcavatorIcon() {
  return (
    <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M4 17l4-8 4 4 4-6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="4" cy="19" r="2" />
      <circle cx="20" cy="19" r="2" />
      <path d="M2 19h2M18 19h2M6 19h12" />
    </svg>
  )
}
