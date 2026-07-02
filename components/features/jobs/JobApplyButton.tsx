'use client'

// 일감 지원 버튼 — 로그인/역할/지원 상태에 따라 UI 분기 + 다중 장비 선택
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { JobStatus, ApplicationStatus, EquipmentCode } from '@/types'
import { APPLICATION_STATUS_LABELS, EQUIPMENT_LABELS } from '@/types'
import { formatLongDate } from '@/lib/utils/date'

interface Props {
  jobId: string
  jobStatus: JobStatus
  userRole: string | null
  isCertified: boolean
  bannedUntil: string | null
  existingApplication: { id: string; status: ApplicationStatus } | null
  equipmentCodes: EquipmentCode[]           // 이 일감에서 필요한 장비 코드 목록
  dispatchedCodes?: Record<string, boolean> // 각 코드의 배차 완료 여부
}

export function JobApplyButton({
  jobId,
  jobStatus,
  userRole,
  isCertified,
  bannedUntil,
  existingApplication,
  equipmentCodes,
  dispatchedCodes = {},
}: Props) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [applied, setApplied] = useState(existingApplication)
  // 다중 장비일 때 선택 단계 표시
  const [showPicker, setShowPicker] = useState(false)

  if (!userRole) {
    return (
      <Link
        href="/login"
        className="block w-full text-center bg-blue-500 text-white font-bold py-4 rounded-2xl text-base hover:bg-blue-600 transition-colors"
      >
        로그인 후 지원하기
      </Link>
    )
  }

  if (jobStatus !== 'open') {
    return (
      <button
        disabled
        className="w-full bg-gray-100 text-gray-400 font-bold py-4 rounded-2xl text-base cursor-not-allowed"
      >
        마감된 일감입니다
      </button>
    )
  }

  if (bannedUntil && new Date(bannedUntil) > new Date()) {
    const until = formatLongDate(bannedUntil)
    return (
      <div className="flex items-center gap-3 w-full bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3">
        <span className="shrink-0 text-base leading-none">🚫</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-orange-700">패널티 누적 — 지원 제한 중</p>
          <p className="text-xs text-orange-500 mt-0.5">{until}까지 지원이 제한됩니다</p>
        </div>
      </div>
    )
  }

  if (userRole === 'driver' && !isCertified) {
    return (
      <Link href="/mypage" className="block w-full group">
        <div className="flex items-center gap-3 w-full bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 group-hover:bg-amber-100 transition-colors">
          <span className="shrink-0 text-base leading-none">⚠️</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-700 whitespace-nowrap">필수 서류 미등록 · 지원 불가</p>
            <p className="text-xs text-amber-500 mt-0.5">마이페이지에서 면허증·이수증을 등록해 주세요</p>
          </div>
          <svg className="shrink-0 w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </Link>
    )
  }

  if (applied) {
    return (
      <button
        disabled
        className="w-full bg-gray-100 text-gray-500 font-bold py-4 rounded-2xl text-base cursor-not-allowed"
      >
        {APPLICATION_STATUS_LABELS[applied.status]}
      </button>
    )
  }

  async function handleApply(equipmentCode: EquipmentCode) {
    setShowPicker(false)
    setIsLoading(true)
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId, applied_equipment_code: equipmentCode }),
      })
      const json = await res.json()
      if (res.status === 409) {
        // 이미 지원한 상태인데 UI가 미반영된 경우 — 버튼 상태 강제 동기화
        setApplied({ id: json.data?.id ?? 'existing', status: 'pending' })
        toast.info('이미 지원한 일감입니다.')
        router.refresh()
        return
      }
      if (!res.ok) throw new Error(json.error ?? '지원 신청에 실패했습니다.')

      setApplied({ id: json.data.id, status: json.data.status as ApplicationStatus })
      toast.success('지원이 완료되었습니다!')
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '지원 신청에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleApplyClick() {
    // 가용 장비 코드 (아직 배차 안 된 코드만)
    const availableCodes = equipmentCodes.filter((c) => !dispatchedCodes[c])
    if (availableCodes.length === 0) {
      toast.error('모든 장비가 이미 배차 완료됐습니다.')
      return
    }
    // 1개든 여러 개든 항상 피커로 보여줌 (자동 지원 방지)
    setShowPicker(true)
  }

  // 장비 선택 UI (다중 장비 모집 시)
  if (showPicker) {
    const availableCodes = equipmentCodes.filter((c) => !dispatchedCodes[c])
    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-500 text-center mb-3">어떤 장비로 지원하시나요?</p>
        {availableCodes.map((code) => (
          <button
            key={code}
            onClick={() => handleApply(code)}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3.5 rounded-2xl text-sm transition-colors"
          >
            {EQUIPMENT_LABELS[code]} ({code}) 로 지원
          </button>
        ))}
        <button
          onClick={() => setShowPicker(false)}
          className="w-full bg-gray-100 text-gray-500 font-semibold py-2.5 rounded-2xl text-sm"
        >
          취소
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleApplyClick}
      disabled={isLoading}
      className="w-full bg-blue-500 text-white font-bold py-4 rounded-2xl text-base hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? '지원 중...' : '지원하기'}
    </button>
  )
}
