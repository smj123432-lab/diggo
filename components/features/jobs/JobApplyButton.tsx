'use client'

// 일감 지원 버튼 — 로그인/역할/지원 상태에 따라 UI 분기
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { JobStatus, ApplicationStatus } from '@/types'
import { APPLICATION_STATUS_LABELS } from '@/types'

interface Props {
  jobId: string
  jobStatus: JobStatus
  userRole: string | null
  existingApplication: { id: string; status: ApplicationStatus } | null
}

export function JobApplyButton({ jobId, jobStatus, userRole, existingApplication }: Props) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [applied, setApplied] = useState(existingApplication)

  if (!userRole) {
    return (
      <Link
        href="/login"
        className="block w-full text-center bg-brand-blue text-white font-bold py-4 rounded-2xl text-base hover:bg-brand-blue-dark transition-colors"
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

  async function handleApply() {
    setIsLoading(true)
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId }),
      })
      const json = await res.json()
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

  return (
    <button
      onClick={handleApply}
      disabled={isLoading}
      className="w-full bg-brand-blue text-white font-bold py-4 rounded-2xl text-base hover:bg-brand-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? '지원 중...' : '지원하기'}
    </button>
  )
}
