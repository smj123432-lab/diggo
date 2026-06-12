// 일감 상세 — Static ("use cache"), 사용자별 영역은 UserJobSection(클라이언트)으로 위임
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCachedJobDetail } from '@/lib/utils/jobs-cache'
import { UserJobSection } from './UserJobSection'
import { KakaoMap } from '@/components/features/jobs/KakaoMap'
import { JobDetailBackButton } from '@/components/features/jobs/JobDetailBackButton'
import { CopyButton } from '@/components/ui/CopyButton'
import {
  EQUIPMENT_LABELS,
  JOB_TYPE_LABELS,
  PAY_DUE_LABELS,
  WORK_DURATION_LABELS,
} from '@/types'
import type { JobType, JobStatus, EquipmentCode, WorkDuration, PayDueType } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

const STATUS_BADGE: Record<JobStatus, { label: string; className: string }> = {
  open:        { label: '모집중',           className: 'bg-emerald-100 text-emerald-700' },
  closed:      { label: '모집 마감',        className: 'bg-gray-100 text-gray-500' },
  in_progress: { label: '🚚 작업중',        className: 'bg-blue-100 text-blue-700' },
  completed:   { label: '🟡 작업완료',      className: 'bg-slate-100 text-slate-600' },
  settled:     { label: '🟢 정산완료',      className: 'bg-emerald-100 text-emerald-700' },
}

const JOB_TYPE_BADGE: Record<JobType, string> = {
  civil:      'bg-emerald-50 text-emerald-700 border border-emerald-200',
  demolition: 'bg-orange-50 text-orange-700 border border-orange-200',
}

export default async function JobDetailPage({ params }: Props) {
  const { id } = await params
  const job = await getCachedJobDetail(id)
  if (!job) notFound()

  const workDate = new Date(job.work_date).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
  })

  const today = new Date().toISOString().split('T')[0]
  const effectiveStatus: JobStatus = (job.status as JobStatus) === 'open' && (job.work_date as string) < today
    ? 'closed'
    : job.status as JobStatus
  const status = STATUS_BADGE[effectiveStatus]

  const PAY_DUE_DAYS: Record<string, number> = { same_day: 0, d3: 3, d7: 7, d14: 14, d30: 30 }
  const payDueDays = PAY_DUE_DAYS[job.pay_due_type as string] ?? 0
  const payDueDateObj = new Date(job.work_date as string)
  payDueDateObj.setDate(payDueDateObj.getDate() + payDueDays)
  const payDueDate = payDueDateObj.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <main className="min-h-screen bg-gray-50 pb-24 lg:pb-8">

      {/* 헤더 */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 py-3 flex items-center gap-3">
          <JobDetailBackButton />
          <span className="flex-1 text-sm font-semibold text-gray-700">일감 상세</span>
          <Link href="/chats" className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-blue-500" title="채팅">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>

      {/* 본문 */}
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-5">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8 lg:items-start">

          {/* ── 좌측 콘텐츠 (col-span-2) ── */}
          <div className="col-span-2 space-y-4">

            {/* 뱃지 + 제목 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center gap-1.5 flex-wrap mb-3">
                {/* 상태 배지: 정적 표시. 소장 본인의 드롭다운은 UserJobSection이 오버레이 */}
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${status.className}`}>
                  {status.label}
                </span>
                {(job.equipment_codes as EquipmentCode[]).map((code) => (
                  <span key={code} className="bg-blue-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                    {EQUIPMENT_LABELS[code]}
                  </span>
                ))}
                <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${JOB_TYPE_BADGE[job.job_type as JobType]}`}>
                  {JOB_TYPE_LABELS[job.job_type as JobType]}
                </span>
              </div>
              <h1 className="text-lg md:text-xl font-bold text-gray-900 leading-snug">{job.title}</h1>
            </div>

            {/* 소장 정보 — 모바일 전용 */}
            <div className="lg:hidden bg-white rounded-2xl border border-gray-200 p-5">
              <ManagerBlock job={job} />
            </div>

            {/* 작업 위치 + 지도 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <p className="text-xs text-gray-400 font-medium mb-3">작업 위치</p>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
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
                <KakaoMap latitude={job.latitude} longitude={job.longitude} />
              )}
            </div>

            {/* 작업 정보 — 모바일 전용 */}
            <div className="lg:hidden bg-white rounded-2xl border border-gray-200 p-5">
              <p className="text-xs text-gray-400 mb-2">지급 금액 <span className="text-gray-300">(대당)</span></p>
              {(job.equipment_codes as EquipmentCode[]).map((code: EquipmentCode) => {
                const amt = (job.pay_amounts as Record<string, number>)[code]
                const days = (job.work_days as Record<string, number>)?.[code]
                return (
                  <div key={code} className="flex items-center justify-between mb-1.5">
                    <div>
                      <span className="text-xs text-gray-500">{EQUIPMENT_LABELS[code]}</span>
                      {days > 0 && <span className="text-xs text-gray-400 ml-1">· {days}일</span>}
                    </div>
                    <span className="text-base font-black text-blue-600">{amt?.toLocaleString()}원</span>
                  </div>
                )
              })}
              <p className="text-xs text-gray-400 mb-4">{PAY_DUE_LABELS[job.pay_due_type as PayDueType]}</p>
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <MetaRow
                  icon={<CalendarIcon />}
                  label="작업일자"
                  value={workDate}
                  sub={job.work_duration ? WORK_DURATION_LABELS[job.work_duration as WorkDuration] : undefined}
                />
                <MetaRow
                  icon={<ExcavatorIconSmall />}
                  label="필요 장비"
                  value={(job.equipment_codes as EquipmentCode[]).map((c: EquipmentCode) => EQUIPMENT_LABELS[c]).join(' · ')}
                />
              </div>
            </div>

            {/* 상세 내용 */}
            {job.description && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <p className="text-xs text-gray-400 font-medium mb-2">상세 내용</p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{job.description}</p>
              </div>
            )}

            {/* 어태치먼트 + 주의사항 */}
            {(job.attachments || job.caution) && (
              <div className="space-y-3">
                {job.job_type === 'demolition' && job.attachments && (
                  <div className="bg-orange-50 rounded-2xl border border-orange-200 p-5">
                    <p className="text-xs text-orange-500 font-semibold mb-1">철거 추가 정보 · 필요 어태치먼트</p>
                    <p className="text-sm text-orange-800 font-medium">{job.attachments}</p>
                  </div>
                )}
                {job.caution && (
                  <div className="bg-amber-50 rounded-2xl border border-amber-300 p-5">
                    <p className="text-xs text-amber-600 font-semibold mb-1">⚠️ 주의사항</p>
                    <p className="text-sm text-amber-900 leading-relaxed">{job.caution}</p>
                  </div>
                )}
              </div>
            )}

            {/* 모바일: 소장 일감 관리 — UserJobSection이 렌더 */}
            <div className="lg:hidden">
              <UserJobSection job={{ ...job, equipment_codes: job.equipment_codes as EquipmentCode[] }} effectiveStatus={effectiveStatus} payDueDate={payDueDate} />
            </div>

          </div>

          {/* ── 우측 퀵 카드 (데스크탑 전용) ── */}
          <div className="hidden lg:block col-span-1">
            <div className="lg:sticky lg:top-24 space-y-3">
              <div className="bg-white rounded-2xl border border-gray-200 px-6 pt-8 pb-6">

                {/* 금액 */}
                <div className="mb-5">
                  <p className="text-xs text-gray-400 mb-2">지급 금액 <span className="text-gray-300">(대당)</span></p>
                  {(job.equipment_codes as EquipmentCode[]).map((code: EquipmentCode) => {
                    const amt = (job.pay_amounts as Record<string, number>)[code]
                    const days = (job.work_days as Record<string, number>)?.[code]
                    return (
                      <div key={code} className="flex items-center justify-between mb-1.5">
                        <div>
                          <span className="text-xs text-gray-500">{EQUIPMENT_LABELS[code]}</span>
                          {days > 0 && <span className="text-xs text-gray-400 ml-1">· {days}일</span>}
                        </div>
                        <span className="text-lg font-black text-blue-600">{amt?.toLocaleString()}원</span>
                      </div>
                    )
                  })}
                  <p className="text-xs text-gray-400 mt-2">{PAY_DUE_LABELS[job.pay_due_type as PayDueType]}</p>
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-3 mb-5">
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 mt-0.5">
                      <CalendarIcon />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">작업일자</p>
                      <p className="text-sm font-semibold text-gray-800">{workDate}</p>
                    </div>
                  </div>
                  {job.work_duration && (
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">
                          {(job.equipment_codes as EquipmentCode[]).length > 1 ? '총 작업 기간' : '작업 기간'}
                        </p>
                        <p className="text-sm font-semibold text-gray-800">
                          {WORK_DURATION_LABELS[job.work_duration as WorkDuration]}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                      <ExcavatorIconSmall />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">필요 장비</p>
                      <p className="text-sm font-semibold text-gray-800">
                        {(job.equipment_codes as EquipmentCode[]).map((c: EquipmentCode) => EQUIPMENT_LABELS[c]).join(' · ')}
                      </p>
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
                        <Link href={`/profiles/${job.profiles.id}`} className="text-sm font-semibold text-gray-800 hover:text-blue-500 transition-colors">{job.profiles.name} 소장</Link>
                        {job.profiles.is_certified && (
                          <span className="inline-flex items-center justify-center bg-blue-500 text-white w-4 h-4 rounded-full shrink-0">
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

                {/* 데스크탑: 사용자별 액션 (지원 버튼 / 소장 관리) */}
                <UserJobSection job={{ ...job, equipment_codes: job.equipment_codes as EquipmentCode[] }} effectiveStatus={effectiveStatus} payDueDate={payDueDate} />

              </div>
            </div>
          </div>

        </div>
      </div>

    </main>
  )
}

/* ── 서브컴포넌트 ── */

function ManagerBlock({ job }: { job: { profiles: { id: string; name: string; is_certified: boolean; rating_avg: number } } }) {
  return (
    <>
      <p className="text-xs text-gray-400 font-medium mb-3">소장 정보</p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm shrink-0">
          {job.profiles.name.charAt(0)}
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <Link href={`/profiles/${job.profiles.id}`} className="text-sm font-semibold text-gray-800 hover:text-blue-500 transition-colors">{job.profiles.name} 소장</Link>
            {job.profiles.is_certified && (
              <span className="inline-flex items-center justify-center bg-blue-500 text-white w-4 h-4 rounded-full shrink-0">
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
      <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
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

function ExcavatorIconSmall() {
  return (
    <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M4 17l4-8 4 4 4-6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="4" cy="19" r="2" />
      <circle cx="20" cy="19" r="2" />
      <path d="M2 19h2M18 19h2M6 19h12" />
    </svg>
  )
}
