// API Route 공통 인증 헬퍼
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types'

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

  return { supabase, user, profile } as const
}

// 역할 미충족 시 forbiddenResponse() 반환, 충족 시 null 반환
export function requireRole(
  profile: { role: string } | null | undefined,
  roles: UserRole[]
): NextResponse | null {
  if (!profile || !roles.includes(profile.role as UserRole)) {
    return forbiddenResponse()
  }
  return null
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
