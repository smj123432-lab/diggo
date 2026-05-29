'use client'

// 평가 작성 모달 — 별점 + 키워드 태그 + 코멘트
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'

const TAGS = [
  { id: 'punctual',      label: '⏱️ 시간 약속을 잘 지켜요' },
  { id: 'skilled',       label: '🏗️ 장비 숙련도가 높아요' },
  { id: 'experienced',   label: '💪 실력이 경력에 맞아요' },
  { id: 'communication', label: '💬 소통이 잘 돼요' },
  { id: 'clean',         label: '🧹 현장 마무리가 깔끔해요' },
]

const RATING_TEXT = ['', '별로였어요', '아쉬웠어요', '보통이에요', '좋았어요', '최고였어요!']
const MAX_COMMENT = 100

interface Props {
  jobId: string
  revieweeId: string
  onClose: () => void
  onSuccess: () => void
}

export function ReviewModal({ jobId, revieweeId, onClose, onSuccess }: Props) {
  const [revieweeName, setRevieweeName] = useState<string | null>(null)
  const [experienceYears, setExperienceYears] = useState<number | null>(null)
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch(`/api/profiles/${revieweeId}`)
      .then((r) => r.json())
      .then((j) => {
        setRevieweeName(j.name ?? null)
        setExperienceYears(j.experience_years ?? null)
      })
      .catch(() => {})
  }, [revieweeId])

  function toggleTag(id: string) {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    )
  }

  async function handleSubmit() {
    if (rating === 0) return
    setLoading(true)

    // 선택 태그 + 한 줄 평가를 합쳐서 comment로 저장
    const tagText = TAGS.filter((t) => selectedTags.includes(t.id)).map((t) => t.label).join(', ')
    const fullComment = [tagText, comment.trim()].filter(Boolean).join('\n') || null

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId, reviewee_id: revieweeId, rating, comment: fullComment }),
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

  const activeRating = hovered || rating
  const canSubmit = rating > 0

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4">
      {/* 배경 */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* 모달 카드 */}
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">

        {/* 헤더 */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-500 px-6 pt-6 pb-8">
          <div className="flex items-start justify-between mb-3">
            <span className="text-xs font-semibold text-blue-200 uppercase tracking-wide">작업 평가</span>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <h2 className="text-base font-bold text-white leading-snug">
            {revieweeName ? (
              <>
                <span>{revieweeName} 기사님</span>
                {experienceYears != null && (
                  <span className="ml-1.5 text-xs font-semibold bg-white/20 text-white px-2 py-0.5 rounded-full align-middle">
                    {experienceYears}년 경력
                  </span>
                )}
                <br />과의 작업은 어떠셨나요?
              </>
            ) : (
              '작업은 어떠셨나요?'
            )}
          </h2>
        </div>

        {/* 별점 — 헤더와 겹치게 올림 */}
        <div className="-mt-5 mx-6 bg-white rounded-2xl shadow-md px-6 py-4 mb-5">
          <div className="flex justify-center gap-2 mb-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                className="text-4xl transition-transform hover:scale-110 active:scale-95"
              >
                <span className={activeRating >= star ? 'text-yellow-400' : 'text-gray-200'}>★</span>
              </button>
            ))}
          </div>
          <p className={`text-center text-sm font-bold transition-colors ${activeRating > 0 ? 'text-blue-600' : 'text-gray-300'}`}>
            {RATING_TEXT[activeRating] || '별점을 선택해주세요'}
          </p>
        </div>

        {/* 키워드 태그 */}
        <div className="px-6 mb-5">
          <p className="text-xs font-semibold text-gray-400 mb-2.5">기사님의 장점을 선택해 주세요 (복수 선택 가능)</p>
          <div className="flex flex-wrap gap-2">
            {TAGS.map((tag) => {
              const active = selectedTags.includes(tag.id)
              return (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all active:scale-95 ${
                    active
                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600'
                  }`}
                >
                  {tag.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* 코멘트 */}
        <div className="px-6 mb-6">
          <div className="relative">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, MAX_COMMENT))}
              placeholder="한 줄 평가를 남겨보세요 (선택사항)"
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-300 resize-none focus:outline-none focus:border-blue-400 transition-colors"
            />
            <span className={`absolute bottom-3 right-3 text-xs tabular-nums ${comment.length >= MAX_COMMENT ? 'text-red-400' : 'text-gray-300'}`}>
              {comment.length} / {MAX_COMMENT}
            </span>
          </div>
        </div>

        {/* 제출 버튼 */}
        <div className="px-6 pb-6">
          <button
            onClick={handleSubmit}
            disabled={loading || !canSubmit}
            className={`w-full font-bold py-3.5 rounded-2xl text-sm transition-all ${
              canSubmit
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 active:scale-[0.98]'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {loading ? '제출 중...' : '평가 제출'}
          </button>
        </div>

      </div>
    </div>,
    document.body,
  )
}
