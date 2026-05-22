'use client'

import { useAuth } from '@/hooks/useAuth'

// 앱 전역에서 Supabase 세션을 한 번만 구독해 Zustand store에 동기화
export function AuthInitializer() {
  useAuth()
  return null
}
