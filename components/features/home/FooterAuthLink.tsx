'use client'

// 푸터 로그인/로그아웃 링크 — 인증 상태에 따라 전환
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { createClient } from '@/lib/supabase/client'

export function FooterAuthLink() {
  const { user } = useAuthStore()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (user) {
    return (
      <button onClick={handleLogout} className="hover:text-brand-blue-deep transition-colors">
        로그아웃
      </button>
    )
  }

  return (
    <Link href="/login" className="hover:text-brand-blue-deep transition-colors">
      로그인
    </Link>
  )
}
