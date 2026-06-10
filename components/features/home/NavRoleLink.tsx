'use client'

// 중앙 nav 역할 기반 링크 — 기사: 내 지원, 소장: 내 일감, 공통: 채팅
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth'

export function NavRoleLink() {
  const { role, user } = useAuthStore()
  const pathname = usePathname()

  const chatActive = pathname === '/chats' || pathname.startsWith('/chats/')
  const chatLink = user ? (
    <Link
      href="/chats"
      className={`px-4 py-2 text-sm rounded-lg transition-colors ${
        chatActive ? 'font-semibold text-white bg-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'
      }`}
    >
      채팅
    </Link>
  ) : null

  if (role === 'driver') {
    const active = pathname === '/mypage/applications'
    return (
      <>
        <Link
          href="/mypage/applications"
          className={`px-4 py-2 text-sm rounded-lg transition-colors ${
            active ? 'font-semibold text-white bg-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          내 지원
        </Link>
        {chatLink}
      </>
    )
  }

  if (role === 'manager') {
    const active = pathname === '/manager/jobs' || pathname.startsWith('/manager/jobs/')
    return (
      <>
        <Link
          href="/manager/jobs"
          className={`px-4 py-2 text-sm rounded-lg transition-colors ${
            active ? 'font-semibold text-white bg-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          내 일감
        </Link>
        {chatLink}
      </>
    )
  }

  return chatLink
}
