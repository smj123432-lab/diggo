'use client'

// 일감 상세 퀵카드 — 소장 전용 상태별 동적 메인 버튼
// open/closed: 수정+삭제 / in_progress: 작업완료 처리 / completed: 지급완료 확인 / settled: 리뷰 작성
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import type { JobStatus } from '@/types'
import { DeleteJobModal } from './DeleteJobModal'
import { ReviewWriteModal } from './ReviewWriteModal'

interface Props {
  jobId: string
  effectiveStatus: JobStatus
  payDueDate?: string | null
}

export function JobOwnerActions({ jobId, effectiveStatus, payDueDate }: Props) {
  const router = useRouter()
  const current = effectiveStatus
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)

  const canEdit = current === 'open' || current === 'closed'
  const canDelete = current === 'open' || current === 'closed'

  async function handleStatusChange(next: JobStatus) {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? '요청 실패')
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '상태 변경에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete() {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/jobs/${jobId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error ?? '삭제 실패')
      toast.success('일감이 삭제되었습니다.')
      router.push('/jobs')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '일감 삭제에 실패했습니다.')
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">

      {/* 메인 액션 버튼 — 상태별 분기 */}
      {canEdit ? (
        <Link
          href={`/jobs/${jobId}/edit`}
          className="block w-full text-center bg-blue-500 text-white font-bold py-3.5 rounded-2xl hover:bg-blue-600 transition-colors text-sm"
        >
          수정하기
        </Link>
      ) : current === 'in_progress' ? (
        <button
          onClick={() => handleStatusChange('completed')}
          disabled={isLoading}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-2xl transition-colors text-sm disabled:opacity-50"
        >
          {isLoading ? '처리 중...' : '현장 작업 완료 처리'}
        </button>
      ) : current === 'completed' ? (
        <>
          {payDueDate && (
            <p className="text-xs text-gray-400 text-center">
              지급 예정일: <span className="text-gray-700 font-semibold">{payDueDate}</span>
            </p>
          )}
          <button
            onClick={() => handleStatusChange('settled')}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl transition-colors text-sm disabled:opacity-50"
          >
            {isLoading ? '처리 중...' : '대금 지급 완료 확인'}
          </button>
        </>
      ) : current === 'settled' ? (
        <button
          onClick={() => setIsReviewModalOpen(true)}
          className="w-full bg-slate-700 text-white font-bold py-3.5 rounded-2xl hover:bg-slate-800 transition-colors text-sm"
        >
          기사님 리뷰 작성하기
        </button>
      ) : null}

      {/* 삭제 — open/closed 상태만 */}
      {canDelete && (
        <button
          onClick={() => setIsDeleteModalOpen(true)}
          disabled={isLoading}
          className="w-full text-center text-xs text-gray-400 hover:text-red-500 transition-colors py-1 disabled:cursor-not-allowed"
        >
          일감 삭제하기
        </button>
      )}

      {isDeleteModalOpen && (
        <DeleteJobModal
          onConfirm={handleDelete}
          onClose={() => setIsDeleteModalOpen(false)}
          isLoading={isLoading}
        />
      )}

      {isReviewModalOpen && (
        <ReviewWriteModal
          jobId={jobId}
          onClose={() => setIsReviewModalOpen(false)}
        />
      )}

    </div>
  )
}
