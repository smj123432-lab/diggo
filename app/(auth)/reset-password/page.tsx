'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { ExcavatorIcon } from '@/components/ui/ExcavatorIcon'

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function checkRules(pw: string) {
  return {
    length: pw.length >= 8 && pw.length <= 16,
    combo: [/[a-zA-Z]/.test(pw), /[0-9]/.test(pw), /[^a-zA-Z0-9]/.test(pw)].filter(Boolean).length >= 2,
  }
}

type PageStatus = 'loading' | 'ready' | 'invalid' | 'done'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [status, setStatus] = useState<PageStatus>('loading')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const rules = checkRules(newPw)
  const isMatch = newPw === confirmPw && confirmPw.length > 0
  const isValid = rules.length && rules.combo && isMatch

  useEffect(() => {
    const supabase = createClient()

    async function init() {
      // URL 해시에서 복구 토큰 직접 파싱 (@supabase/ssr은 자동 감지 불안정)
      const hash = window.location.hash.slice(1)
      const params = new URLSearchParams(hash)
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      const type = params.get('type')

      if (accessToken && type === 'recovery') {
        // 해시 URL 정리 (토큰 재노출 방지)
        window.history.replaceState(null, '', window.location.pathname)

        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken ?? '',
        })
        setStatus(error ? 'invalid' : 'ready')
        return
      }

      // 해시 없음 — 이미 세션이 있는 경우(페이지 리로드)인지 확인
      const { data: { session } } = await supabase.auth.getSession()
      setStatus(session ? 'ready' : 'invalid')
    }

    init()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid) return

    setIsSubmitting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: newPw })
      if (error) throw error

      toast.success('비밀번호가 변경되었습니다. 다시 로그인해 주세요.')
      setStatus('done')
      setTimeout(() => router.push('/login'), 1500)
    } catch {
      toast.error('비밀번호 변경에 실패했습니다. 링크가 만료되었을 수 있습니다.')
    } finally {
      setIsSubmitting(false)
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
          <h1 className="text-sm font-semibold text-slate-300 ml-1">비밀번호 재설정</h1>
        </div>
      </nav>

      <div className="pt-16 flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">

          {status === 'loading' && (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
              <div className="w-10 h-10 mx-auto border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm text-gray-500">링크를 확인하는 중입니다...</p>
            </div>
          )}

          {status === 'invalid' && (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center space-y-4">
              <div className="w-14 h-14 mx-auto bg-red-50 rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <div>
                <p className="text-base font-black text-gray-900 mb-1">링크가 만료되었습니다</p>
                <p className="text-sm text-gray-500">재설정 링크는 1회만 사용 가능하며 유효 기간이 있습니다.</p>
              </div>
              <Link
                href="/find-password"
                className="block w-full py-3 text-sm font-bold text-white bg-blue-500 hover:bg-blue-600 rounded-xl transition-colors text-center"
              >
                링크 다시 받기
              </Link>
            </div>
          )}

          {status === 'ready' && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="mb-6">
                <h2 className="text-base font-black text-gray-900">새 비밀번호 설정</h2>
                <p className="text-xs text-gray-400 mt-1">새로 사용할 비밀번호를 입력해 주세요.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">새 비밀번호</label>
                  <div className="relative">
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                      placeholder="새 비밀번호 입력"
                      autoComplete="new-password"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <EyeIcon open={showNew} />
                    </button>
                  </div>
                  {newPw.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className={`text-xs flex items-center gap-1.5 ${rules.length ? 'text-emerald-600' : 'text-gray-400'}`}>
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${rules.length ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                          {rules.length ? '✓' : '·'}
                        </span>
                        8~16자
                      </p>
                      <p className={`text-xs flex items-center gap-1.5 ${rules.combo ? 'text-emerald-600' : 'text-gray-400'}`}>
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${rules.combo ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                          {rules.combo ? '✓' : '·'}
                        </span>
                        영문, 숫자, 특수문자 중 2가지 이상 조합
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">비밀번호 확인</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPw}
                      onChange={(e) => setConfirmPw(e.target.value)}
                      placeholder="새 비밀번호 재입력"
                      autoComplete="new-password"
                      className={`w-full border rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 bg-white ${
                        confirmPw.length > 0 && !isMatch
                          ? 'border-red-300 focus:ring-red-400'
                          : 'border-gray-200 focus:ring-blue-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <EyeIcon open={showConfirm} />
                    </button>
                  </div>
                  {confirmPw.length > 0 && !isMatch && (
                    <p className="mt-1.5 text-xs text-red-500">비밀번호가 일치하지 않습니다.</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!isValid || isSubmitting}
                  className="w-full py-3 text-sm font-bold text-white bg-blue-500 hover:bg-blue-600 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? '변경 중...' : '변경 완료'}
                </button>
              </form>
            </div>
          )}

          {status === 'done' && (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center space-y-3">
              <div className="w-14 h-14 mx-auto bg-emerald-50 rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-base font-black text-gray-900">비밀번호가 변경되었습니다!</p>
              <p className="text-sm text-gray-500">로그인 페이지로 이동합니다...</p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
