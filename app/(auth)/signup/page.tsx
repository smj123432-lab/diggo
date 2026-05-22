'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { UserRole, JobType, EquipmentCode } from '@/types'
import { ExcavatorIcon } from '@/components/ui/ExcavatorIcon'
import { JOB_TYPE_LABELS, EQUIPMENT_LABELS } from '@/types'

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

// 선호 지역 목록
const REGIONS = [
  '서울', '경기', '인천', '강원',
  '충북', '충남', '대전', '세종',
  '전북', '전남', '광주',
  '경북', '경남', '대구', '부산', '울산',
  '제주',
]

// 눈 아이콘 — 비밀번호 보기/숨기기
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

// 칩(선택 토글) 컴포넌트
function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition ${
        selected
          ? 'border-blue-500 bg-blue-50 text-blue-700'
          : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      {label}
    </button>
  )
}

function SignupPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)

  // ?role=driver 또는 ?role=manager 쿼리파라미터로 Step 2 자동 이동
  useEffect(() => {
    const roleParam = searchParams.get('role') as UserRole | null
    if (roleParam === 'driver' || roleParam === 'manager') {
      setSelectedRole(roleParam)
      setStep(2)
    }
  }, [searchParams])

  // Step 2 — 기본 정보
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [emailTouched, setEmailTouched] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [pwTouched, setPwTouched] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)

  // Step 3 — 선호 설정
  const [preferredJobTypes, setPreferredJobTypes] = useState<JobType[]>([])
  const [preferredEquipmentCodes, setPreferredEquipmentCodes] = useState<EquipmentCode[]>([])
  const [preferredRegions, setPreferredRegions] = useState<string[]>([])

  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // 비밀번호 규칙: 8~16자, 영문/숫자/특수문자 중 2가지 이상
  const pwRules = {
    length: password.length >= 8 && password.length <= 16,
    combo:
      [/[a-zA-Z]/.test(password), /[0-9]/.test(password), /[^a-zA-Z0-9]/.test(password)].filter(
        Boolean
      ).length >= 2,
  }
  const isPwValid = pwRules.length && pwRules.combo
  const isPwMatch = password.length > 0 && confirmPassword.length > 0 && confirmPassword === password

  const isFormValid =
    name.trim().length > 0 &&
    email.length > 0 &&
    !emailError &&
    isPwValid &&
    isPwMatch

  // 이메일 유효성 검사
  const validateEmail = (value: string) => {
    if (!value) { setEmailError(''); return }
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    setEmailError(ok ? '' : '올바른 이메일 형식이 아닙니다.')
  }

  // 역할 선택 — 다른 역할 선택 시 폼 전체 초기화
  const handleRoleSelect = (role: UserRole) => {
    if (role !== selectedRole) {
      setName(''); setEmail(''); setPassword(''); setConfirmPassword('')
      setEmailTouched(false); setEmailError(''); setPwTouched(false)
      setShowPw(false); setShowConfirmPw(false); setError('')
      setPreferredJobTypes([]); setPreferredEquipmentCodes([]); setPreferredRegions([])
    }
    setSelectedRole(role)
    setStep(2)
  }

  // Step 2 → Step 3
  const handleStep2Next = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isPwValid) { setPwTouched(true); return }
    if (emailError || !email) return
    if (!isPwMatch) return
    setStep(3)
  }

  // 선호 토글
  const toggleJobType = (t: JobType) =>
    setPreferredJobTypes((prev) => prev.includes(t) ? prev.filter((v) => v !== t) : [...prev, t])
  const toggleEquipment = (c: EquipmentCode) =>
    setPreferredEquipmentCodes((prev) => prev.includes(c) ? prev.filter((v) => v !== c) : [...prev, c])
  const toggleRegion = (r: string) =>
    setPreferredRegions((prev) => prev.includes(r) ? prev.filter((v) => v !== r) : [...prev, r])

  // 최종 가입
  const handleSignUp = async () => {
    if (!selectedRole) return
    setError('')
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: selectedRole,
            preferred_job_types: selectedRole === 'driver' ? preferredJobTypes : [],
            preferred_equipment_codes: selectedRole === 'manager' ? preferredEquipmentCodes : [],
            preferred_regions: preferredRegions,
          },
        },
      })

      if (authError) {
        if (
          authError.message.includes('already registered') ||
          authError.message.includes('User already registered')
        ) {
          setError('이미 사용 중인 이메일입니다.')
        } else {
          setError('회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
        }
        return
      }

      if (data.session) { router.push('/jobs'); router.refresh(); return }
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

  // 스테퍼 레이블
  const stepLabels = ['역할', '정보', '선호']

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-md">
        {/* 로고 */}
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
          {/* 3단계 스테퍼 */}
          <div className="flex items-center gap-1 mb-10">
            {[1, 2, 3].map((n, i) => (
              <React.Fragment key={n}>
                <div className="flex items-center gap-1.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${step >= n ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                    {n}
                  </div>
                  <span className={`text-xs font-medium transition ${step === n ? 'text-gray-900' : 'text-gray-400'}`}>
                    {stepLabels[i]}
                  </span>
                </div>
                {i < 2 && <div className="flex-1 h-px bg-gray-200" />}
              </React.Fragment>
            ))}
          </div>

          {/* ─── Step 1: 역할 선택 ─── */}
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

          {/* ─── Step 2: 정보 입력 ─── */}
          {step === 2 && selectedRole && (
            <div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
              >
                ← 역할 다시 선택
              </button>
              <h2 className="text-xl font-bold text-gray-900 mb-1">정보를 입력해주세요</h2>
              <div className="flex items-center gap-2 mb-8">
                <div className="w-6 h-5 flex items-center justify-center">
                  {selectedRole === 'driver'
                    ? <ExcavatorIcon className="w-6 h-5 text-blue-600" />
                    : <span className="text-base">📋</span>}
                </div>
                <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  {ROLE_OPTIONS.find((o) => o.role === selectedRole)?.label}
                </span>
              </div>

              <form onSubmit={handleStep2Next} className="space-y-4">
                {/* 이름 */}
                <div className="space-y-1">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">이름</label>
                  <input
                    id="name" type="text" required autoComplete="name" maxLength={10}
                    value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="홍길동"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>

                {/* 이메일 */}
                <div className="space-y-1">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">이메일</label>
                  <input
                    id="email" type="email" required autoComplete="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (emailTouched) validateEmail(e.target.value) }}
                    onBlur={(e) => { setEmailTouched(true); validateEmail(e.target.value) }}
                    placeholder="example@email.com"
                    className={`w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition ${
                      emailError ? 'border-red-400 focus:ring-red-400'
                        : emailTouched && email && !emailError ? 'border-green-400 focus:ring-green-400'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                  {emailError && (
                    <p className="flex items-center gap-1.5 text-xs text-red-500 mt-1"><span>❌</span>{emailError}</p>
                  )}
                </div>

                {/* 비밀번호 */}
                <div className="space-y-1">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">비밀번호</label>
                  <div className="relative">
                    <input
                      id="password" type={showPw ? 'text' : 'password'} required autoComplete="new-password" maxLength={16}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setPwTouched(true) }}
                      placeholder="8~16자, 영문/숫자/특수문자 중 2가지 이상"
                      className={`w-full px-4 py-3 pr-11 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition ${
                        pwTouched && !isPwValid ? 'border-red-400 focus:ring-red-400'
                          : pwTouched && isPwValid ? 'border-green-400 focus:ring-green-400'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                    />
                    <button type="button" onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition" tabIndex={-1}>
                      <EyeIcon open={showPw} />
                    </button>
                  </div>
                  {pwTouched && (
                    <ul className="mt-2 space-y-1">
                      <li className={`flex items-center gap-1.5 text-xs ${pwRules.length ? 'text-green-600' : 'text-red-500'}`}>
                        <span>{pwRules.length ? '✅' : '❌'}</span>8~16자
                      </li>
                      <li className={`flex items-center gap-1.5 text-xs ${pwRules.combo ? 'text-green-600' : 'text-red-500'}`}>
                        <span>{pwRules.combo ? '✅' : '❌'}</span>영문/숫자/특수문자 중 2가지 이상 조합
                      </li>
                    </ul>
                  )}
                </div>

                {/* 비밀번호 확인 */}
                <div className="space-y-1">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">비밀번호 확인</label>
                  <div className="relative">
                    <input
                      id="confirmPassword" type={showConfirmPw ? 'text' : 'password'} required autoComplete="new-password" maxLength={16}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="비밀번호 재입력"
                      className={`w-full px-4 py-3 pr-11 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition ${
                        confirmPassword && password.length > 0 && confirmPassword !== password ? 'border-red-400 focus:ring-red-400'
                          : confirmPassword && password.length > 0 && confirmPassword === password ? 'border-green-400 focus:ring-green-400'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                    />
                    <button type="button" onClick={() => setShowConfirmPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition" tabIndex={-1}>
                      <EyeIcon open={showConfirmPw} />
                    </button>
                  </div>
                  {confirmPassword && password.length > 0 && (
                    <p className={`flex items-center gap-1.5 text-xs mt-2 ${isPwMatch ? 'text-green-600' : 'text-red-500'}`}>
                      <span>{isPwMatch ? '✅' : '❌'}</span>
                      {isPwMatch ? '비밀번호가 일치합니다.' : '비밀번호가 일치하지 않습니다.'}
                    </p>
                  )}
                </div>

                {/* 다음 버튼 */}
                <button
                  type="submit"
                  className={`w-full py-3 text-white font-semibold rounded-xl transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    isFormValid ? 'bg-blue-500 hover:bg-blue-600 cursor-pointer' : 'bg-gray-300 cursor-not-allowed'
                  }`}
                  disabled={!isFormValid}
                >
                  다음
                </button>
              </form>
            </div>
          )}

          {/* ─── Step 3: 선호 설정 ─── */}
          {step === 3 && selectedRole && (
            <div>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
              >
                ← 정보 수정
              </button>

              {selectedRole === 'driver' ? (
                <>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">어떤 작업을 선호하시나요?</h2>
                  <p className="text-sm text-gray-500 mb-8">나중에 프로필에서 변경할 수 있습니다</p>

                  <div className="space-y-6">
                    {/* 작업 유형 */}
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-3">선호 작업 유형</p>
                      <div className="flex flex-wrap gap-2">
                        {(Object.entries(JOB_TYPE_LABELS) as [JobType, string][]).map(([code, label]) => (
                          <Chip
                            key={code}
                            label={label}
                            selected={preferredJobTypes.includes(code)}
                            onClick={() => toggleJobType(code)}
                          />
                        ))}
                      </div>
                    </div>

                    {/* 선호 지역 */}
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-3">선호 지역 <span className="text-gray-400 font-normal">(복수 선택 가능)</span></p>
                      <div className="flex flex-wrap gap-2">
                        {REGIONS.map((region) => (
                          <Chip
                            key={region}
                            label={region}
                            selected={preferredRegions.includes(region)}
                            onClick={() => toggleRegion(region)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">선호하는 장비 종류를 선택해주세요</h2>
                  <p className="text-sm text-gray-500 mb-8">나중에 프로필에서 변경할 수 있습니다</p>

                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-3">선호 장비 <span className="text-gray-400 font-normal">(복수 선택 가능)</span></p>
                    <div className="flex flex-wrap gap-2">
                      {(Object.entries(EQUIPMENT_LABELS) as [EquipmentCode, string][]).map(([code, label]) => (
                        <Chip
                          key={code}
                          label={label}
                          selected={preferredEquipmentCodes.includes(code)}
                          onClick={() => toggleEquipment(code)}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}

              {error && (
                <div className="mt-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* 하단 버튼 */}
              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={handleSignUp}
                  disabled={isLoading}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium rounded-xl transition disabled:opacity-50"
                >
                  나중에 설정하기
                </button>
                <button
                  type="button"
                  onClick={handleSignUp}
                  disabled={isLoading}
                  className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition disabled:bg-blue-300"
                >
                  {isLoading ? '가입 중...' : '완료'}
                </button>
              </div>
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

export default function SignupPage() {
  return (
    <Suspense>
      <SignupPageInner />
    </Suspense>
  )
}
