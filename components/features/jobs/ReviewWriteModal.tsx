'use client'

// 기사 리뷰 작성 모달 — 소장이 정산완료 일감에서 수락된 기사를 평가
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { EQUIPMENT_LABELS } from '@/types'
import type { EquipmentCode } from '@/types'

interface AcceptedDriver {
  id: string
  driver_id: string
  applied_equipment_code: string | null
  profiles: { id: string; name: string; avatar_url: string | null }
}

interface Props {
  jobId: string
  onClose: () => void
}

export function ReviewWriteModal({ jobId, onClose }: Props) {
  const router = useRouter()
  const [drivers, setDrivers] = useState<AcceptedDriver[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    fetch(`/api/jobs/${jobId}/accepted-drivers`)
      .then((r) => r.json())
      .then((r) => setDrivers(r.data ?? []))
      .catch(() => toast.error('기사 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [jobId])

  const current = drivers[currentIndex]
  const isLast = currentIndex === drivers.length - 1

  async function handleSubmit() {
    if (rating === 0) {
      toast.error('별점을 선택해주세요.')
      return
    }
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: jobId,
          reviewee_id: current.driver_id,
          rating,
          comment: comment.trim() || null,
        }),
      })
      const json = await res.json()
      if (res.status === 409) {
        toast.error('이미 작성한 평가입니다.')
      } else if (!res.ok) {
        throw new Error(json.error ?? '평가 작성에 실패했습니다.')
      } else {
        toast.success('평가가 완료됐습니다.')
      }

      if (isLast) {
        setDone(true)
        router.refresh()
      } else {
        setCurrentIndex((i) => i + 1)
        setRating(0)
        setComment('')
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '평가 작성에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleSkip() {
    if (isLast) {
      onClose()
    } else {
      setCurrentIndex((i) => i + 1)
      setRating(0)
      setComment('')
    }
  }

  const modal = (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl px-6 pt-6 pb-8 z-10">

        {/* 핸들 */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5 sm:hidden" />

        {loading ? (
          <div className="py-10 text-center text-sm text-gray-400">불러오는 중...</div>
        ) : drivers.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-gray-500">수락된 기사가 없습니다.</p>
            <button onClick={onClose} className="mt-4 text-sm text-blue-500 font-semibold">닫기</button>
          </div>
        ) : done ? (
          <div className="py-10 text-center">
            <p className="text-2xl mb-3">🎉</p>
            <p className="text-base font-bold text-gray-800 mb-1">모든 평가가 완료됐습니다</p>
            <p className="text-sm text-gray-400 mb-6">소중한 평가 감사합니다.</p>
            <button
              onClick={onClose}
              className="w-full bg-blue-500 text-white font-bold py-3.5 rounded-2xl text-sm"
            >
              닫기
            </button>
          </div>
        ) : (
          <>
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-gray-900">기사님 평가</h2>
              {drivers.length > 1 && (
                <span className="text-xs text-gray-400">{currentIndex + 1} / {drivers.length}</span>
              )}
            </div>

            {/* 기사 프로필 */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-base shrink-0">
                {current.profiles.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">{current.profiles.name} 기사님</p>
                {current.applied_equipment_code && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {EQUIPMENT_LABELS[current.applied_equipment_code as EquipmentCode]}
                  </p>
                )}
              </div>
            </div>

            {/* 별점 */}
            <div className="mb-5">
              <p className="text-xs text-gray-500 font-medium mb-2.5">작업 만족도</p>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    className="text-3xl transition-transform active:scale-90"
                  >
                    <span className={(hovered || rating) >= star ? 'text-yellow-400' : 'text-gray-200'}>
                      ★
                    </span>
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-xs text-center text-gray-400 mt-1.5">
                  {['', '별로였어요', '아쉬웠어요', '보통이에요', '좋았어요', '최고였어요'][rating]}
                </p>
              )}
            </div>

            {/* 코멘트 */}
            <div className="mb-6">
              <p className="text-xs text-gray-500 font-medium mb-2">한마디 (선택)</p>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={300}
                rows={3}
                placeholder="작업 후기를 남겨주세요."
                className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-3 resize-none outline-none focus:border-blue-400 text-gray-800 placeholder:text-gray-300"
              />
            </div>

            {/* 버튼 */}
            <div className="flex flex-col gap-2">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || rating === 0}
                className="w-full bg-blue-500 text-white font-bold py-3.5 rounded-2xl text-sm hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '저장 중...' : '평가 완료'}
              </button>
              <button
                onClick={handleSkip}
                className="w-full text-xs text-gray-400 hover:text-gray-600 py-2 transition-colors"
              >
                {isLast ? '닫기' : '건너뛰기'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )

  if (typeof window === 'undefined') return null
  return createPortal(modal, document.body)
}
