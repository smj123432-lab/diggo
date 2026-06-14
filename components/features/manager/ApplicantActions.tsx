'use client'

// 지원자 상세 — 상태 변경 액션 버튼 (검토중 / 수락 / 거절 / 배차 취소)
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { ApplicationStatus } from '@/types'

interface Props {
  applicationId: string
  currentStatus: ApplicationStatus
  jobId: string
}

export function ApplicantActions({ applicationId, currentStatus, jobId }: Props) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  async function handleChange(status: ApplicationStatus) {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? '요청 실패')

      if (status === 'accepted') {
        toast.success('기사님을 수락했습니다. 일감이 작업중으로 전환됩니다.')
        router.push('/manager/jobs')
      } else if (status === 'rejected') {
        toast.success('지원을 거절했습니다.')
        router.push(`/manager/jobs/${jobId}/applicants`)
      } else {
        toast.success('검토중으로 변경되었습니다.')
        router.refresh()
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '상태 변경에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCancel() {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/applications/${applicationId}/cancel`, { method: 'PATCH' })
      if (!res.ok) throw new Error((await res.json()).error ?? '요청 실패')
      toast.success('배차가 취소되었습니다.')
      router.push(`/manager/jobs/${jobId}/applicants`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '취소 처리에 실패했습니다.')
    } finally {
      setIsLoading(false)
      setShowCancelConfirm(false)
    }
  }

  if (currentStatus === 'cancelled_by_driver') {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-center">
        <p className="text-orange-600 font-semibold text-sm">기사가 배차를 취소했습니다</p>
        <p className="text-orange-500 text-xs mt-1">해당 기사에게 패널티가 부여되었습니다.</p>
      </div>
    )
  }

  if (currentStatus === 'cancelled_by_manager') {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-center">
        <p className="text-orange-600 font-semibold text-sm">소장님이 배차를 취소했습니다</p>
      </div>
    )
  }

  if (currentStatus === 'accepted') {
    return (
      <>
        <div className="flex flex-col gap-2.5">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
            <p className="text-emerald-700 font-semibold text-sm">수락 완료</p>
            <p className="text-emerald-600 text-xs mt-1">일감이 작업중 상태로 전환됩니다.</p>
          </div>
          <button
            onClick={() => setShowCancelConfirm(true)}
            disabled={isLoading}
            className="w-full text-center text-sm font-medium text-red-400 hover:text-red-600 transition-colors py-1.5"
          >
            배차 취소
          </button>
        </div>

        {showCancelConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
              <h3 className="text-base font-bold text-gray-900 mb-2">배차 취소</h3>
              <p className="text-sm text-gray-500 mb-1">취소 시 소장님께 <span className="text-orange-500 font-semibold">패널티</span>가 부여됩니다.</p>
              <p className="text-sm text-gray-500 mb-6">패널티는 프로필에 표시되어 이후 기사 모집에 영향을 줄 수 있습니다.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  disabled={isLoading}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {isLoading ? '처리중...' : '배차 취소 확정'}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  if (currentStatus === 'rejected') {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center">
        <p className="text-gray-500 font-semibold text-sm">거절된 지원</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2.5">
      {currentStatus === 'pending' && (
        <button
          onClick={() => handleChange('reviewing')}
          disabled={isLoading}
          className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-3.5 rounded-2xl transition-colors text-sm border border-blue-200 disabled:opacity-50"
        >
          {isLoading ? '처리 중...' : '채팅하며 검토하기'}
        </button>
      )}
      <button
        onClick={() => handleChange('accepted')}
        disabled={isLoading}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3.5 rounded-2xl transition-colors text-sm disabled:opacity-50"
      >
        {isLoading ? '처리 중...' : '기사 수락 (배차 확정)'}
      </button>
      <button
        onClick={() => handleChange('rejected')}
        disabled={isLoading}
        className="w-full text-center text-sm font-medium text-slate-500 hover:text-red-500 transition-colors py-1.5 disabled:cursor-not-allowed"
      >
        거절하기
      </button>
    </div>
  )
}
