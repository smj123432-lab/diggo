'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { createClient } from '@/lib/supabase/client'

// 헤더 우측 버튼 — 로그인 상태에 따라 다르게 렌더링
export function NavButtons() {
  const { user, isLoading } = useAuthStore()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-20 h-8 rounded-lg bg-white/10 animate-pulse" />
        <div className="w-24 h-8 rounded-lg bg-white/20 animate-pulse" />
      </div>
    )
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/mypage"
          className="text-sm text-slate-300 hover:text-white transition-colors"
        >
          마이페이지
        </Link>
        <button
          onClick={handleLogout}
          className="text-sm border border-white/20 hover:border-white/40 text-white px-4 py-2 rounded-lg transition-colors bg-white/5"
        >
          로그아웃
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/login"
        className="text-sm border border-white/20 hover:border-white/40 text-white px-4 py-2 rounded-lg transition-colors bg-white/5"
      >
        로그인
      </Link>
      <Link
        href="/signup"
        className="text-sm bg-blue-500 hover:bg-blue-400 text-white font-bold px-4 py-2 rounded-lg transition-colors"
      >
        시작하기
      </Link>
    </div>
  )
}
