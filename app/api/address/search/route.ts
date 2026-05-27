import { NextRequest, NextResponse } from 'next/server'

// GET /api/address/search?q=성수동 — 카카오 로컬 API 프록시 (REST 키 서버에서만 사용)
export async function GET(request: NextRequest) {
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const q = request.nextUrl.searchParams.get('q')?.trim()
  if (!q) return NextResponse.json({ documents: [] })

  const key = process.env.KAKAO_REST_API_KEY
  if (!key) return NextResponse.json({ error: '카카오 API 키가 없습니다.' }, { status: 500 })

  const headers = { Authorization: `KakaoAK ${key}` }

  // 1차: 주소 검색
  const addrRes = await fetch(
    `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(q)}&size=10`,
    { headers }
  )
  const addrJson = await addrRes.json()

  if (addrJson.documents?.length > 0) {
    return NextResponse.json({ documents: addrJson.documents })
  }

  // 2차 fallback: 키워드 검색
  const kwRes = await fetch(
    `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(q)}&size=10`,
    { headers }
  )
  const kwJson = await kwRes.json()
  return NextResponse.json({ documents: kwJson.documents ?? [] })
}
