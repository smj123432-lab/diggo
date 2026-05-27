'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ExcavatorIcon } from '@/components/ui/ExcavatorIcon'

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

// useSearchParams는 Suspense 경계 안에서 사용
function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/jobs'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

      if (authError) {
        if (authError.message.includes('Email not confirmed')) {
          setError('이메일 인증이 필요합니다. 받은 메일함을 확인해주세요.')
        } else {
          setError('이메일 또는 비밀번호가 올바르지 않습니다.')
        }
        return
      }

      router.push(redirect)
      router.refresh()
    } catch {
      setError('로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          이메일
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@email.com"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          비밀번호
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPw ? 'text' : 'password'}
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호 입력"
            className="w-full px-4 py-3 pr-11 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
            tabIndex={-1}
          >
            <EyeIcon open={showPw} />
          </button>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold rounded-xl transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        {isLoading ? '로그인 중...' : '로그인'}
      </button>

      <p className="text-center text-sm text-gray-500">
        아직 계정이 없으신가요?{' '}
        <Link href="/signup" className="text-blue-600 font-medium hover:underline">
          회원가입
        </Link>
      </p>
    </form>
  )
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-md">
        {/* 로고 영역 — 홈과 동일한 slate-900 + blue 조합 */}
        <div className="flex flex-col items-center mb-10">
          <div className="inline-flex items-center gap-2.5 bg-slate-900 px-6 py-3 rounded-2xl mb-3">
            <img src="/logo.png" alt="Diggo" className="h-8 w-auto object-contain" style={{filter: "invert(1) hue-rotate(180deg) brightness(1.2) saturate(3)"}} />
            <span className="text-xl font-black tracking-tight text-white">
              Diggo<span className="text-blue-400">.</span>
            </span>
          </div>
          <p className="text-gray-500 text-sm">굴착기 배차 플랫폼</p>
        </div>

        {/* 로그인 카드 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">로그인</h2>
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  )
}
