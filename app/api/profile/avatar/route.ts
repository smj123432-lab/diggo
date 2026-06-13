import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST /api/profile/avatar — 프로필 사진 업로드
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 })

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
      return NextResponse.json({ error: 'jpg, png, webp 파일만 가능합니다.' }, { status: 400 })
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: '파일 크기는 5MB 이하여야 합니다.' }, { status: 400 })
    }

    const admin = createAdminClient()

    const path = `${user.id}/avatar.${ext}`
    const arrayBuffer = await file.arrayBuffer()

    const { error: storageErr } = await admin.storage
      .from('avatars')
      .upload(path, arrayBuffer, {
        contentType: file.type,
        upsert: true,
      })

    if (storageErr) throw storageErr

    const { data: { publicUrl } } = admin.storage
      .from('avatars')
      .getPublicUrl(path)

    // 캐시 무효화를 위한 타임스탬프 쿼리 파라미터
    const avatarUrl = `${publicUrl}?t=${Date.now()}`

    const { error: updateErr } = await admin
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', user.id)

    if (updateErr) throw updateErr

    return NextResponse.json({ avatar_url: avatarUrl })
  } catch (error) {
    console.error('[POST /api/profile/avatar]', error)
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: `업로드 실패: ${msg}` }, { status: 500 })
  }
}
