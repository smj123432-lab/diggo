import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST /api/certifications/signed-url — Supabase Storage 서명 업로드 URL 발급
// 파일 자체는 클라이언트가 이 URL로 직접 PUT해 Vercel body 제한을 우회한다
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

    const { cert_type, file_name } = await request.json()
    if (!cert_type) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })

    const ext = (file_name as string | undefined)?.split('.').pop() ?? 'jpg'
    const path = `${user.id}/${cert_type}/${Date.now()}.${ext}`

    const admin = createAdminClient()
    const { data, error } = await admin.storage
      .from('certifications')
      .createSignedUploadUrl(path)

    if (error) throw error

    return NextResponse.json({ signedUrl: data.signedUrl, path })
  } catch (e) {
    console.error('[POST /api/certifications/signed-url]', e)
    return NextResponse.json({ error: '업로드 URL 생성에 실패했습니다.' }, { status: 500 })
  }
}
