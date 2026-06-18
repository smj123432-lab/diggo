import { NextRequest, NextResponse } from 'next/server'
import { CERT_AUTO_MIN_RATING, CERT_AUTO_MIN_REVIEWS } from '@/types'
import { getAuthUser, unauthorizedResponse } from '@/lib/api/auth'

// GET /api/reviews?type=given|received
// given → 내가 작성한 리뷰의 job_id 배열 (hasReview 체크용)
// received → 내가 받은 리뷰 목록
export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') ?? 'received'

    if (type === 'given') {
      const { data } = await supabase
        .from('reviews')
        .select('job_id, reviewee_id')
        .eq('reviewer_id', user.id)
      return NextResponse.json({ data: data ?? [] })
    }

    const { data: reviews } = await supabase
      .from('reviews')
      .select('id, rating, comment, created_at, job_id, reviewer_id')
      .eq('reviewee_id', user.id)
      .order('created_at', { ascending: false })

    if (!reviews || reviews.length === 0) {
      return NextResponse.json({ data: [] })
    }

    const jobIds = Array.from(new Set(reviews.map((r) => r.job_id)))
    const reviewerIds = Array.from(new Set(reviews.map((r) => r.reviewer_id)))

    const [{ data: jobs }, { data: reviewers }] = await Promise.all([
      supabase.from('jobs').select('id, title').in('id', jobIds),
      supabase.from('profiles').select('id, name').in('id', reviewerIds),
    ])

    const jobMap = new Map((jobs ?? []).map((j) => [j.id, j.title]))
    const reviewerMap = new Map((reviewers ?? []).map((r) => [r.id, r.name]))

    const data = reviews.map((r) => ({
      ...r,
      job_title: jobMap.get(r.job_id) ?? null,
      reviewer_name: reviewerMap.get(r.reviewer_id) ?? null,
    }))

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[GET /api/reviews]', error)
    return NextResponse.json({ error: '조회에 실패했습니다.' }, { status: 500 })
  }
}

// POST /api/reviews — 평가 작성 (정산완료 일감에만)
export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const body = await request.json()
    const { job_id, reviewee_id, rating, comment } = body

    if (!job_id || !reviewee_id || !rating) {
      return NextResponse.json({ error: '필수 항목을 입력해주세요.' }, { status: 400 })
    }

    if (typeof rating !== 'number' || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json({ error: '평점은 1~5 사이의 정수여야 합니다.' }, { status: 400 })
    }

    // 정산완료 일감인지 확인
    const { data: job } = await supabase
      .from('jobs')
      .select('status')
      .eq('id', job_id)
      .single()

    if (job?.status !== 'settled') {
      return NextResponse.json({ error: '정산이 완료된 일감에만 평가를 작성할 수 있습니다.' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('reviews')
      .insert({ job_id, reviewer_id: user.id, reviewee_id, rating, comment })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: '이 일감에 대한 평가를 이미 작성했습니다.' }, { status: 409 })
      }
      console.error('[POST /api/reviews] insert error:', JSON.stringify(error))
      return NextResponse.json({ error: `DB 오류: ${error.code} — ${error.message}` }, { status: 500 })
    }

    // 리뷰 등록 성공 후 대상자의 평점 재집계 → profiles 업데이트
    const { data: allRatings } = await supabase
      .from('reviews')
      .select('rating')
      .eq('reviewee_id', reviewee_id)

    const count = allRatings?.length ?? 0
    const avg = count > 0
      ? Math.round((allRatings!.reduce((sum, r) => sum + r.rating, 0) / count) * 100) / 100
      : 0

    // 평점 조건 충족 시 is_certified 자동 부여 (관리자 인증과 독립적으로 작동)
    const shouldAutoCertify = avg >= CERT_AUTO_MIN_RATING && count >= CERT_AUTO_MIN_REVIEWS

    await supabase
      .from('profiles')
      .update({
        rating_avg: avg,
        review_count: count,
        ...(shouldAutoCertify ? { is_certified: true } : {}),
      })
      .eq('id', reviewee_id)

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/reviews] catch:', error)
    return NextResponse.json({ error: '평가 작성에 실패했습니다.' }, { status: 500 })
  }
}
