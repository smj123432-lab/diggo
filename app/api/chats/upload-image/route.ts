// 채팅 이미지 업로드 — service_role로 스토리지 RLS 우회
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const roomId = formData.get('roomId') as string | null

  if (!file || !roomId) {
    return NextResponse.json({ error: '파일 또는 roomId 누락' }, { status: 400 })
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: '이미지 파일만 전송할 수 있습니다.' }, { status: 400 })
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: '10MB 이하의 이미지만 전송할 수 있습니다.' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${roomId}/${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const admin = createAdminClient()
  const { data, error } = await admin.storage
    .from('chat-images')
    .upload(path, buffer, { contentType: file.type })

  if (error) {
    console.error('[chat-upload]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: { publicUrl } } = admin.storage
    .from('chat-images')
    .getPublicUrl(data.path)

  return NextResponse.json({ publicUrl })
}
