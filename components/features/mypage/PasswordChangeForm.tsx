// 비밀번호 변경 폼 — 현재 비밀번호 검증 + 새 비밀번호 유효성 체크
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

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

export function PasswordChangeForm() {
  const router = useRouter()
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const rules = checkRules(newPw)
  const isMatch = newPw === confirmPw && confirmPw.length > 0
  const isValid = rules.length && rules.combo && isMatch && currentPw.length > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid) return
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/auth/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? '비밀번호 변경에 실패했습니다.')
        return
      }
      toast.success('비밀번호가 변경되었습니다.')
      router.push('/mypage')
    } catch {
      toast.error('비밀번호 변경에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 현재 비밀번호 */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">현재 비밀번호</label>
        <div className="relative">
          <input
            type={showCurrent ? 'text' : 'password'}
            value={currentPw}
            onChange={(e) => setCurrentPw(e.target.value)}
            placeholder="현재 비밀번호 입력"
            required
            autoComplete="current-password"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
          <button
            type="button"
            onClick={() => setShowCurrent((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <EyeIcon open={showCurrent} />
          </button>
        </div>
      </div>

      {/* 새 비밀번호 */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">새 비밀번호</label>
        <div className="relative">
          <input
            type={showNew ? 'text' : 'password'}
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            placeholder="새 비밀번호 입력"
            required
            autoComplete="new-password"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
          <button
            type="button"
            onClick={() => setShowNew((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <EyeIcon open={showNew} />
          </button>
        </div>

        {/* 실시간 규칙 체크 */}
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

      {/* 새 비밀번호 확인 */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">새 비밀번호 확인</label>
        <div className="relative">
          <input
            type={showConfirm ? 'text' : 'password'}
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            placeholder="새 비밀번호 재입력"
            required
            autoComplete="new-password"
            className={`w-full border rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 bg-white ${
              confirmPw.length > 0 && !isMatch
                ? 'border-red-300 focus:ring-red-400'
                : 'border-gray-200 focus:ring-blue-500'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
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
        {isSubmitting ? '변경 중...' : '비밀번호 변경'}
      </button>
    </form>
  )
}
