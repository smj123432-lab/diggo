'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ExcavatorIcon } from '@/components/ui/ExcavatorIcon'

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function FindPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [sent, setSent] = useState(false)

  const emailValid = isValidEmail(email)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!emailValid) return

    setIsSending(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          redirectTo: `${window.location.origin}/reset-password`,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? '이메일 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.')
        return
      }

      setSent(true)
      toast.success('비밀번호 재설정 링크를 전송했습니다.')
    } catch {
      toast.error('이메일 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/10 bg-slate-900/90 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/login" className="text-slate-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <ExcavatorIcon className="w-8 h-6 text-blue-400" />
            <span className="text-base font-black tracking-tight text-white">
              Diggo<span className="text-blue-400">.</span>
            </span>
          </Link>
          <h1 className="text-sm font-semibold text-slate-300 ml-1">비밀번호 찾기</h1>
        </div>
      </nav>

      <div className="pt-16 flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          {sent ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center space-y-4">
              <div className="w-14 h-14 mx-auto bg-blue-50 rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <div>
                <p className="text-base font-black text-gray-900 mb-1">메일을 확인해 주세요</p>
                <p className="text-sm text-gray-500">
                  <span className="font-semibold text-gray-700">{email}</span>으로<br />
                  비밀번호 재설정 링크를 전송했습니다.
                </p>
              </div>
              <p className="text-xs text-gray-400">메일이 보이지 않으면 스팸함을 확인해 주세요.</p>
              <button
                onClick={() => router.push('/login')}
                className="w-full py-3 text-sm font-bold text-white bg-blue-500 hover:bg-blue-600 rounded-xl transition-colors"
              >
                로그인으로 돌아가기
              </button>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
              <div>
                <h2 className="text-base font-black text-gray-900">비밀번호 찾기</h2>
                <p className="text-xs text-gray-400 mt-1">가입하신 이메일 주소를 입력하면 재설정 링크를 보내드립니다.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">이메일</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="가입한 이메일 주소"
                    autoComplete="email"
                    className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 bg-white ${
                      email.length > 0 && !emailValid
                        ? 'border-red-300 focus:ring-red-400'
                        : 'border-gray-200 focus:ring-blue-500'
                    }`}
                  />
                  {email.length > 0 && !emailValid && (
                    <p className="mt-1.5 text-xs text-red-500">올바른 이메일 형식을 입력해 주세요.</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!emailValid || isSending}
                  className="w-full py-3 text-sm font-bold text-white bg-blue-500 hover:bg-blue-600 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSending ? '전송 중...' : '재설정 링크 발송'}
                </button>
              </form>

              <div className="text-center">
                <Link href="/login" className="text-sm text-gray-400 hover:text-blue-600 transition-colors">
                  로그인으로 돌아가기
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
