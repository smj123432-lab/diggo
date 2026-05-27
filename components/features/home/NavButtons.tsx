'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { createClient } from '@/lib/supabase/client'

// 헤더 우측 버튼 — 데스크톱: 텍스트 버튼 / 모바일: 햄버거 메뉴
export function NavButtons() {
  const { user, role, isLoading } = useAuthStore()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleLogout = async () => {
    setMenuOpen(false)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const close = () => setMenuOpen(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center gap-3">
        <div className="hidden md:block w-20 h-8 rounded-lg bg-white/10 animate-pulse" />
        <div className="hidden md:block w-24 h-8 rounded-lg bg-white/20 animate-pulse" />
        <div className="md:hidden w-8 h-8 rounded-lg bg-white/10 animate-pulse" />
      </div>
    )
  }

  return (
    <>
      {/* ── 데스크톱 ── */}
      {user ? (
        <div className="hidden md:flex items-center gap-3">
          <Link href="/mypage" className="text-sm text-slate-300 hover:text-white transition-colors">
            마이페이지
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm border border-white/20 hover:border-white/40 text-white px-4 py-2 rounded-lg transition-colors bg-white/5"
          >
            로그아웃
          </button>
        </div>
      ) : (
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="text-sm border border-white/20 hover:border-white/40 text-white px-4 py-2 rounded-lg transition-colors bg-white/5">
            로그인
          </Link>
          <Link href="/signup" className="text-sm bg-blue-500 hover:bg-blue-400 text-white font-bold px-4 py-2 rounded-lg transition-colors">
            시작하기
          </Link>
        </div>
      )}

      {/* ── 모바일 햄버거 버튼 ── */}
      <button
        ref={buttonRef}
        onClick={() => setMenuOpen((v) => !v)}
        className="md:hidden flex flex-col justify-center items-center w-9 h-9 gap-1.5 text-white"
        aria-label="메뉴"
      >
        <span className={`block w-5 h-0.5 bg-white rounded-full transition-all duration-200 origin-center ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
        <span className={`block w-5 h-0.5 bg-white rounded-full transition-all duration-200 ${menuOpen ? 'opacity-0 scale-x-0' : ''}`} />
        <span className={`block w-5 h-0.5 bg-white rounded-full transition-all duration-200 origin-center ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
      </button>

      {/* ── 딤드 오버레이 ── */}
      <div
        className={`md:hidden fixed inset-0 bg-black/40 z-30 transition-opacity duration-200 ${
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={close}
      />

      {/* ── 드롭다운 메뉴 ── */}
      <div
        className={`md:hidden fixed top-16 right-0 z-[45] w-52 bg-slate-900/95 backdrop-blur-md border-l border-b border-white/10 rounded-bl-2xl shadow-xl overflow-hidden transition-all duration-200 ease-out ${
          menuOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        {user ? (
          <>
            {role === 'manager' && (
              <Link
                href="/manager/jobs"
                onClick={close}
                className="flex items-center gap-3 px-4 py-3.5 text-sm text-slate-200 hover:bg-white/10 transition-colors"
              >
                <svg className="w-4 h-4 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M9 9h6M9 13h6M9 17h4" strokeLinecap="round" />
                </svg>
                내 일감
              </Link>
            )}
            {role === 'driver' && (
              <Link
                href="/mypage/applications"
                onClick={close}
                className="flex items-center gap-3 px-4 py-3.5 text-sm text-slate-200 hover:bg-white/10 transition-colors"
              >
                <svg className="w-4 h-4 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                  <rect x="9" y="3" width="6" height="4" rx="1" />
                  <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                내 지원
              </Link>
            )}
            <Link
              href="/mypage/ledger"
              onClick={close}
              className="flex items-center gap-3 px-4 py-3.5 text-sm text-slate-200 hover:bg-white/10 transition-colors border-t border-white/5"
            >
              <svg className="w-4 h-4 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="1" />
                <line x1="9" y1="12" x2="15" y2="12" /><line x1="9" y1="16" x2="13" y2="16" />
              </svg>
              장부
            </Link>
            <Link
              href="/mypage"
              onClick={close}
              className="flex items-center gap-3 px-4 py-3.5 text-sm text-slate-200 hover:bg-white/10 transition-colors border-t border-white/5"
            >
              <svg className="w-4 h-4 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              마이페이지
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-red-400 hover:bg-white/10 transition-colors border-t border-white/5"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              로그아웃
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              onClick={close}
              className="flex items-center gap-3 px-4 py-3.5 text-sm text-slate-200 hover:bg-white/10 transition-colors"
            >
              로그인
            </Link>
            <Link
              href="/signup"
              onClick={close}
              className="flex items-center gap-3 px-4 py-3.5 text-sm text-blue-400 font-semibold hover:bg-white/10 transition-colors border-t border-white/5"
            >
              시작하기
            </Link>
          </>
        )}
      </div>
    </>
  )
}
