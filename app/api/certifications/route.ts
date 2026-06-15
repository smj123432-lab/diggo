import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST /api/certifications — 면허·안전교육 서류 DB 등록 (파일은 클라이언트가 Storage에 직접 업로드)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

    const { cert_type: certType, path } = await request.json()
    if (!certType || !path) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })

    const admin = createAdminClient()

    const { data: { publicUrl } } = admin.storage
      .from('certifications')
      .getPublicUrl(path)

    // 같은 타입의 기존 서류 삭제 (재업로드 시 재검토)
    const { error: deleteErr } = await admin
      .from('certifications')
      .delete()
      .eq('driver_id', user.id)
      .eq('cert_type', certType)
    if (deleteErr) throw deleteErr

    // 새 서류 삽입
    const { error: dbErr } = await admin
      .from('certifications')
      .insert({ driver_id: user.id, cert_type: certType, image_url: publicUrl, status: 'pending' })
    if (dbErr) throw dbErr

    // 재업로드 시 인증 초기화 (재검토 필요)
    await admin
      .from('profiles')
      .update({ is_certified: false })
      .eq('id', user.id)

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[POST /api/certifications]', e)
    return NextResponse.json({ error: '업로드에 실패했습니다.' }, { status: 500 })
  }
}
