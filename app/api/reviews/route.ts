import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/reviews — 평가 작성 (완료된 일감에만)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const body = await request.json()
    const { job_id, reviewee_id, rating, comment } = body

    if (!job_id || !reviewee_id || !rating) {
      return NextResponse.json({ error: '필수 항목을 입력해주세요.' }, { status: 400 })
    }

    if (typeof rating !== 'number' || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json({ error: '평점은 1~5 사이의 정수여야 합니다.' }, { status: 400 })
    }

    // 완료된 일감인지 확인
    const { data: job } = await supabase
      .from('jobs')
      .select('status')
      .eq('id', job_id)
      .single()

    if (job?.status !== 'completed') {
      return NextResponse.json({ error: '완료된 일감에만 평가를 작성할 수 있습니다.' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('reviews')
      .insert({ job_id, reviewer_id: user.id, reviewee_id, rating, comment })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: '이미 평가를 작성했습니다.' }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/reviews]', error)
    return NextResponse.json({ error: '평가 작성에 실패했습니다.' }, { status: 500 })
  }
}
