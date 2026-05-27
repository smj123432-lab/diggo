import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/certifications — 면허·안전교육 서류 제출 (pending 상태로 등록)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 })

    // Supabase Storage에 업로드
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${user.id}/${Date.now()}.${ext}`
    const { error: storageErr } = await supabase.storage
      .from('certifications')
      .upload(path, file, { upsert: true })
    if (storageErr) throw storageErr

    const { data: { publicUrl } } = supabase.storage
      .from('certifications')
      .getPublicUrl(path)

    // DB에 pending 레코드 삽입
    const { error: dbErr } = await supabase
      .from('certifications')
      .insert({ driver_id: user.id, file_url: publicUrl, status: 'pending' })
    if (dbErr) throw dbErr

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[POST /api/certifications]', e)
    return NextResponse.json({ error: '업로드에 실패했습니다.' }, { status: 500 })
  }
}
