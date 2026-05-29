import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/profiles/[id] — 공개 프로필 기본 정보 (이름, 평점)
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    const { data } = await supabase
      .from('profiles')
      .select('name, rating_avg')
      .eq('id', params.id)
      .single()

    return NextResponse.json({ name: data?.name ?? null, rating_avg: data?.rating_avg ?? null })
  } catch (error) {
    console.error('[GET /api/profiles/[id]]', error)
    return NextResponse.json({ name: null, rating_avg: null })
  }
}
