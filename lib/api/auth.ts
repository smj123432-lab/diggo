// API Route 공통 인증 헬퍼
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

// user + profile(id, role, is_certified, banned_until) 한 번에 조회
// 미로그인 시 { error: Response } 반환
export async function getAuthUserWithProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: unauthorizedResponse() } as const
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, role, is_certified, banned_until')
    .eq('id', user.id)
    .single()

  // 프로필이 없으면 인증 실패로 처리 — null profile은 optional chaining 시 권한 체크가 우회될 수 있음
  if (!profile) {
    return { error: unauthorizedResponse() } as const
  }

  return { supabase, user, profile } as const
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
}

export function forbiddenResponse(msg = '권한이 없습니다.') {
  return NextResponse.json({ error: msg }, { status: 403 })
}

export function isBanned(profile: { banned_until?: string | null }): boolean {
  return !!profile.banned_until && new Date(profile.banned_until) > new Date()
}
