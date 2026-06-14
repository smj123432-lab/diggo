// API Route 공통 인증 헬퍼
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
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
