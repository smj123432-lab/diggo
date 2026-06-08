'use client'

// 채팅 목록 헤더 — 뒤로가기(router.back) + 타이틀
import { useRouter } from 'next/navigation'

export default function ChatListHeader() {
  const router = useRouter()
  return (
    <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
          aria-label="뒤로가기"
        >
          <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="text-base font-bold text-slate-900">채팅</h1>
      </div>
    </div>
  )
}
