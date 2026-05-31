import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// cookies() 없음 — "use cache" 함수에서 사용. 공개 데이터(anon RLS 범위) 전용
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// 서버 컴포넌트 및 API Routes에서 사용하는 Supabase 클라이언트
// "use no-store" → 이 함수를 호출하는 서버 컴포넌트는 캐시에서 제외됨 (force-dynamic 대체)
export async function createClient() {
  'use no-store'
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // 서버 컴포넌트에서 쿠키 설정 불가 시 무시 (middleware에서 처리)
          }
        },
      },
    }
  )
}
