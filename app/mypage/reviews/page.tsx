// 마이페이지 — 받은 평가 목록
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatFullDate } from '@/lib/utils/date'

interface ReviewItem {
  id: string
  rating: number
  comment: string | null
  created_at: string
  job_title: string | null
  reviewer_name: string | null
}

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="text-base leading-none">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= rating ? 'text-yellow-400' : 'text-gray-200'}>★</span>
      ))}
    </span>
  )
}

export default async function ReviewsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rawReviews } = await supabase
    .from('reviews')
    .select('id, rating, comment, created_at, job_id, reviewer_id')
    .eq('reviewee_id', user.id)
    .order('created_at', { ascending: false })

  let reviews: ReviewItem[] = []

  if (rawReviews && rawReviews.length > 0) {
    const jobIds = Array.from(new Set(rawReviews.map((r) => r.job_id)))
    const reviewerIds = Array.from(new Set(rawReviews.map((r) => r.reviewer_id)))

    const [{ data: jobs }, { data: reviewers }] = await Promise.all([
      supabase.from('jobs').select('id, title').in('id', jobIds),
      supabase.from('profiles').select('id, name').in('id', reviewerIds),
    ])

    const jobMap = new Map((jobs ?? []).map((j) => [j.id, j.title]))
    const reviewerMap = new Map((reviewers ?? []).map((r) => [r.id, r.name]))

    reviews = rawReviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
      job_title: jobMap.get(r.job_id) ?? null,
      reviewer_name: reviewerMap.get(r.reviewer_id) ?? null,
    }))
  }

  const avg = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null

  return (
    <main className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/mypage" className="p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <span className="flex-1 text-sm font-semibold text-gray-700">받은 평가</span>
          <Link href="/chats" className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-blue-500" title="채팅">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-5">

        {/* 평균 평점 카드 */}
        {avg && (
          <div className="bg-white border border-blue-100 rounded-2xl p-5 mb-5 flex items-center gap-4">
            <div className="text-4xl font-black text-slate-900">{avg}</div>
            <div>
              <StarRow rating={Math.round(Number(avg))} />
              <p className="text-xs text-gray-400 mt-1">총 {reviews.length}개의 평가</p>
            </div>
          </div>
        )}

        {reviews.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">⭐</p>
            <p className="text-gray-400 text-sm">아직 받은 평가가 없습니다.</p>
            <p className="text-gray-300 text-xs mt-1">정산이 완료된 일감 후 평가를 받을 수 있어요.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {reviews.map((review) => {
              const date = formatFullDate(review.created_at)
              return (
                <div key={review.id} className="bg-white border border-gray-200 rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <StarRow rating={review.rating} />
                      {review.job_title && (
                        <p className="text-xs text-gray-400 mt-1">{review.job_title}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-300 shrink-0">{date}</span>
                  </div>
                  {review.comment ? (
                    <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
                  ) : (
                    <p className="text-sm text-gray-300 italic">코멘트 없음</p>
                  )}
                  {review.reviewer_name && (
                    <p className="text-xs text-gray-400 mt-2">— {review.reviewer_name}</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
