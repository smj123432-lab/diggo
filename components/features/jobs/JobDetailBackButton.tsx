'use client'

import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'

// 일감 상세 뒤로가기 — 기사: 내 지원, 소장: 내 일감, 비로그인: 일감 찾기
export function JobDetailBackButton() {
  const router = useRouter()
  const role = useAuthStore((s) => s.role)

  function handleBack() {
    router.push('/jobs')
  }

  return (
    <button
      onClick={handleBack}
      className="p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 transition-colors"
      aria-label="뒤로가기"
    >
      <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}
