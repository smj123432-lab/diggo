'use client'

// 기사 — 지원한 일감 목록 + 4단계 필터
import { useState } from 'react'
import Link from 'next/link'
import type { EquipmentCode, JobStatus } from '@/types'
import { EQUIPMENT_LABELS } from '@/types'

export interface DriverApplication {
  id: string
  status: string
  applied_at: string
  job: {
    id: string
    title: string
    work_date: string
    status: JobStatus
    equipment_codes: EquipmentCode[]
    location: string
    pay_amounts: Record<string, number>
  }
  equipment: { id: string; model_code: EquipmentCode } | null
}

type StageFilter = 'all' | 'applying' | 'confirmed' | 'pending_settlement' | 'settled'

const STAGE_TABS: { value: StageFilter; label: string; desc: string }[] = [
  { value: 'all',                label: '전체',    desc: '' },
  { value: 'applying',           label: '지원중',  desc: '소장님 선택 대기' },
  { value: 'confirmed',          label: '배차완료', desc: '출근 확정' },
  { value: 'pending_settlement', label: '정산대기', desc: '입금 대기' },
  { value: 'settled',            label: '정산완료', desc: '입금 완료' },
]

const STAGE_BAR: Record<StageFilter, string> = {
  all:                '',
  applying:           'bg-blue-400',
  confirmed:          'bg-emerald-400',
  pending_settlement: 'bg-amber-400',
  settled:            'bg-emerald-400',
}

const STAGE_BADGE: Record<StageFilter, string> = {
  all:                '',
  applying:           'bg-blue-50 text-brand-blue-deep',
  confirmed:          'bg-emerald-50 text-emerald-700',
  pending_settlement: 'bg-amber-50 text-amber-700',
  settled:            'bg-emerald-50 text-emerald-700',
}

function getStage(appStatus: string, jobStatus: JobStatus): StageFilter {
  if (appStatus === 'pending' || appStatus === 'reviewing') return 'applying'
  if (appStatus === 'accepted') {
    if (jobStatus === 'settled') return 'settled'
    if (jobStatus === 'completed') return 'pending_settlement'
    return 'confirmed'
  }
  return 'applying'
}

interface Props {
  applications: DriverApplication[]
}

export function DriverApplicationsList({ applications }: Props) {
  const [filter, setFilter] = useState<StageFilter>('all')
  const withStage = applications.map((app) => ({
    ...app,
    stage: app.status === 'rejected' ? null : getStage(app.status, app.job.status),
  }))

  const counts: Record<StageFilter, number> = {
    all:                applications.filter((a) => a.status !== 'rejected').length,
    applying:           withStage.filter((a) => a.stage === 'applying').length,
    confirmed:          withStage.filter((a) => a.stage === 'confirmed').length,
    pending_settlement: withStage.filter((a) => a.stage === 'pending_settlement').length,
    settled:            withStage.filter((a) => a.stage === 'settled').length,
  }

  const filtered = withStage
    .filter((app) => filter === 'all' || app.stage === filter)
    .sort((a, b) => {
      if (filter === 'all') {
        // 정산완료·거절은 하단
        const aBottom = a.stage === 'settled' || a.stage === null
        const bBottom = b.stage === 'settled' || b.stage === null
        if (aBottom !== bBottom) return aBottom ? 1 : -1
      }
      return new Date(a.job.work_date).getTime() - new Date(b.job.work_date).getTime()
    })

  return (
    <>
      {/* 필터 탭 */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-5">
        {STAGE_TABS.map((tab) => {
          const count = counts[tab.value]
          return (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`shrink-0 text-xs font-semibold px-3.5 py-1.5 rounded-full transition-colors ${
                filter === tab.value
                  ? 'bg-brand-blue text-white'
                  : 'bg-white border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-brand-blue-dark'
              }`}
            >
              {tab.label}{count > 0 ? ` (${count})` : ''}
            </button>
          )
        })}
      </div>

      <p className="text-sm font-semibold text-gray-700 mb-4">{filtered.length}건</p>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-sm mb-4">
            {filter === 'all' ? '아직 지원한 일감이 없습니다.' : '해당 단계의 일감이 없습니다.'}
          </p>
          {filter === 'all' && (
            <Link
              href="/jobs"
              className="inline-block bg-brand-blue text-white font-bold px-6 py-3 rounded-2xl text-sm hover:bg-brand-blue-dark transition-colors"
            >
              일감 찾아보기
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((app) => {
            const { job, equipment, stage } = app
            const effectiveStage = stage ?? 'applying'

            const workDate = new Date(job.work_date).toLocaleDateString('ko-KR', {
              month: 'numeric', day: 'numeric', weekday: 'short',
            })

            const payValues = Object.values(job.pay_amounts)
            const payMin = Math.min(...payValues)
            const payMax = Math.max(...payValues)
            const payText = payMin === payMax
              ? `${payMin.toLocaleString()}원`
              : `${payMin.toLocaleString()}~${payMax.toLocaleString()}원`

            const stageLabel = STAGE_TABS.find((t) => t.value === effectiveStage)
            const isRejected = app.status === 'rejected'

            return (
              <Link key={app.id} href={`/jobs/${job.id}`} className="block">
                <div className={`bg-white border rounded-2xl overflow-hidden flex transition-all hover:shadow-md ${
                  isRejected ? 'border-gray-100 opacity-60' : 'border-gray-200 hover:border-blue-300'
                }`}>
                  {/* 좌측 컬러 바 */}
                  {!isRejected && (
                    <div className={`w-1.5 shrink-0 ${STAGE_BAR[effectiveStage]}`} />
                  )}

                  <div className="flex-1 px-4 py-4 flex items-center gap-4">
                    {/* 좌측: 뱃지·제목·위치 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-2">
                        {isRejected ? (
                          <span className="bg-red-50 text-red-400 text-xs font-semibold px-2 py-0.5 rounded-md">
                            거절됨
                          </span>
                        ) : (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${STAGE_BADGE[effectiveStage]}`}>
                            {stageLabel?.label}
                          </span>
                        )}
                        {equipment && (
                          <span className="bg-brand-blue text-white text-xs font-bold px-2 py-0.5 rounded-md">
                            {EQUIPMENT_LABELS[equipment.model_code]}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-1">{job.title}</h3>
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        {job.location}
                      </p>
                    </div>

                    {/* 우측: 날짜·금액 */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="text-xs text-slate-400">{workDate}</span>
                      <span className="text-sm font-bold text-gray-800">{payText}</span>
                      {!isRejected && stageLabel?.desc && (
                        <span className="text-xs text-gray-400">{stageLabel.desc}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}
