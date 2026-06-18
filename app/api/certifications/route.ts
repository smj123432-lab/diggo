import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthUser, unauthorizedResponse } from '@/lib/api/auth'

// POST /api/certifications — 면허·안전교육 서류 제출 (pending 상태로 등록)
export async function POST(request: NextRequest) {
  try {
    // 인증 확인은 일반 클라이언트로
    const { user } = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 })
    const certType = (formData.get('cert_type') as string | null) ?? 'general'

    // Storage 업로드는 service role로 RLS 우회
    const admin = createAdminClient()

    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${user.id}/${certType}/${Date.now()}.${ext}`
    const { error: storageErr } = await admin.storage
      .from('certifications')
      .upload(path, file, { upsert: true })
    if (storageErr) throw storageErr

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
