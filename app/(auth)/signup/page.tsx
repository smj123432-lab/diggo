'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/types'
import { ExcavatorIcon } from '@/components/ui/ExcavatorIcon'

// 역할 선택 카드 데이터
const ROLE_OPTIONS: { role: UserRole; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    role: 'driver',
    label: '굴착기 기사',
    desc: '일감을 찾고 수입을 관리합니다',
    icon: <ExcavatorIcon className="w-9 h-7 text-slate-700" />,
  },
  {
    role: 'manager',
    label: '현장 소장',
    desc: '일감을 등록하고 기사를 구합니다',
    icon: <span className="text-3xl">📋</span>,
  },
]

export default function SignupPage() {
  const router = useRouter()

  // 1단계: 역할 선택 / 2단계: 정보 입력
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role)
    setStep(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!selectedRole) {
      setError('역할을 선택해주세요.')
      return
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.')
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // 트리거가 raw_user_meta_data에서 name, role을 읽어 profiles 행 생성
          data: { name, role: selectedRole },
        },
      })

      if (authError) {
        if (authError.message.includes('already registered') || authError.message.includes('User already registered')) {
          setError('이미 사용 중인 이메일입니다.')
        } else {
          setError('회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
        }
        return
      }

      // 이메일 인증 없이 자동 로그인된 경우
      if (data.session) {
        router.push('/jobs')
        router.refresh()
        return
      }

      // 이메일 인증이 필요한 경우
      setIsSuccess(true)
    } catch {
      setError('회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  // 이메일 인증 안내 화면
  if (isSuccess) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10">
            <div className="text-5xl mb-4">📧</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">이메일을 확인해주세요</h2>
            <p className="text-gray-500 text-sm mb-6">
              <span className="font-medium text-gray-700">{email}</span>로<br />
              인증 링크를 발송했습니다.
            </p>
            <Link
              href="/login"
              className="inline-block w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition text-center"
            >
              로그인 페이지로
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-md">
        {/* 로고 영역 — 홈과 동일한 slate-900 + blue 조합 */}
        <div className="flex flex-col items-center mb-10">
          <div className="inline-flex items-center gap-2.5 bg-slate-900 px-6 py-3 rounded-2xl mb-3">
            <ExcavatorIcon className="w-8 h-6 text-blue-400" />
            <span className="text-xl font-black tracking-tight text-white">
              Diggo<span className="text-blue-400">.</span>
            </span>
          </div>
          <p className="text-gray-500 text-sm">굴착기 배차 플랫폼</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* 단계 표시 */}
          <div className="flex items-center gap-2 mb-6">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                1
              </div>
              <span className={`text-sm font-medium ${step === 1 ? 'text-gray-900' : 'text-gray-400'}`}>역할 선택</span>
            </div>
            <div className="flex-1 h-px bg-gray-200" />
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                2
              </div>
              <span className={`text-sm font-medium ${step === 2 ? 'text-gray-900' : 'text-gray-400'}`}>정보 입력</span>
            </div>
          </div>

          {/* 1단계: 역할 선택 */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">어떤 역할로 가입하시나요?</h2>
              <p className="text-sm text-gray-500 mb-6">가입 후에는 역할 변경이 불가합니다</p>
              <div className="space-y-3">
                {ROLE_OPTIONS.map(({ role, label, desc, icon }) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleRoleSelect(role)}
                    className="w-full flex items-center gap-4 p-5 border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl transition group text-left"
                  >
                    <div className="flex-shrink-0">{icon}</div>
                    <div>
                      <p className="font-semibold text-gray-900 group-hover:text-blue-700">{label}</p>
                      <p className="text-sm text-gray-500">{desc}</p>
                    </div>
                    <div className="ml-auto text-gray-300 group-hover:text-blue-400">→</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2단계: 정보 입력 */}
          {step === 2 && selectedRole && (
            <div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
              >
                ← 역할 다시 선택
              </button>
              <h2 className="text-xl font-bold text-gray-900 mb-1">정보를 입력해주세요</h2>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-6 h-5 flex items-center justify-center">
                  {selectedRole === 'driver'
                    ? <ExcavatorIcon className="w-6 h-5 text-blue-600" />
                    : <span className="text-base">📋</span>}
                </div>
                <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  {ROLE_OPTIONS.find((o) => o.role === selectedRole)?.label}
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    이름
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="홍길동"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>

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
                  <input
                    id="password"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="6자 이상"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    비밀번호 확인
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="비밀번호 재입력"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
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
                  {isLoading ? '가입 중...' : '가입하기'}
                </button>
              </form>
            </div>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="text-blue-600 font-medium hover:underline">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
