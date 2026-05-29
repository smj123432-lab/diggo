'use client'

// 평가 작성 모달 — 별점 + 코멘트
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'

interface Props {
  jobId: string
  revieweeId: string
  onClose: () => void
  onSuccess: () => void
}

export function ReviewModal({ jobId, revieweeId, onClose, onSuccess }: Props) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (rating === 0) {
      toast.error('별점을 선택해주세요.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId, reviewee_id: revieweeId, rating, comment: comment.trim() || null }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? '평가 작성에 실패했습니다.')
        return
      }
      toast.success('평가가 등록되었습니다.')
      onSuccess()
    } catch {
      toast.error('네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* 배경 */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* 모달 */}
      <div className="relative w-full max-w-sm mx-4 bg-white rounded-3xl p-6 shadow-2xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-bold text-slate-900">평가 작성</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* 별점 */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className="text-4xl transition-transform active:scale-90 hover:scale-110"
            >
              <span className={(hovered || rating) >= star ? 'text-yellow-400' : 'text-gray-200'}>
                ★
              </span>
            </button>
          ))}
        </div>

        {/* 별점 텍스트 */}
        <p className="text-center text-sm font-semibold text-gray-500 mb-5">
          {rating === 0 && '별점을 선택해주세요'}
          {rating === 1 && '⭐ 별로였어요'}
          {rating === 2 && '⭐⭐ 아쉬웠어요'}
          {rating === 3 && '⭐⭐⭐ 보통이에요'}
          {rating === 4 && '⭐⭐⭐⭐ 좋았어요'}
          {rating === 5 && '⭐⭐⭐⭐⭐ 최고였어요!'}
        </p>

        {/* 코멘트 */}
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="한 줄 평가 (선택사항)"
          maxLength={200}
          rows={3}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-300 resize-none focus:outline-none focus:border-blue-400 mb-5"
        />

        {/* 제출 버튼 */}
        <button
          onClick={handleSubmit}
          disabled={loading || rating === 0}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3.5 rounded-2xl text-sm transition-colors"
        >
          {loading ? '제출 중...' : '평가 제출'}
        </button>
      </div>
    </div>,
    document.body,
  )
}
