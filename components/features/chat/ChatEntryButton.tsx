'use client'

// 채팅 진입 버튼 — POST /api/chats 후 채팅방으로 이동
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Props {
  jobId: string
  driverId: string
}

export default function ChatEntryButton({ jobId, driverId }: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function handleClick() {
    setIsLoading(true)
    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId, driver_id: driverId }),
      })
      const json = await res.json() as { data?: { id: string }; error?: string }
      if (!res.ok) throw new Error(json.error ?? '채팅방 생성 실패')
      router.push(`/chats/${json.data!.id}`)
    } catch {
      toast.error('채팅방을 열지 못했습니다. 다시 시도해 주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className="w-full flex items-center justify-center gap-2 rounded-xl border border-blue-500 text-blue-500 py-3 text-sm font-semibold hover:bg-blue-50 active:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {isLoading ? '연결 중...' : '채팅하기'}
    </button>
  )
}
