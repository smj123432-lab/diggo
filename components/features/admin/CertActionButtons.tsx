'use client'

// 인증 서류 승인/거절 버튼 — pending 상태일 때만 렌더링
import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Props {
  certId: string
  currentStatus: string
}

export function CertActionButtons({ certId, currentStatus }: Props) {
  const [loading, setLoading] = useState<'approved' | 'rejected' | null>(null)
  const router = useRouter()

  async function handleAction(action: 'approved' | 'rejected') {
    setLoading(action)
    try {
      const res = await fetch(`/api/admin/certifications/${certId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? '처리 실패')
      toast.success(action === 'approved' ? '승인되었습니다.' : '거절되었습니다.')
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '처리에 실패했습니다.')
    } finally {
      setLoading(null)
    }
  }

  if (currentStatus === 'approved') {
    return (
      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 shrink-0">
        승인됨
      </span>
    )
  }

  if (currentStatus === 'rejected') {
    return (
      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-500 shrink-0">
        거절됨
      </span>
    )
  }

  return (
    <div className="flex gap-2 shrink-0">
      <button
        onClick={() => handleAction('approved')}
        disabled={!!loading}
        className="text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading === 'approved' ? '처리중...' : '승인'}
      </button>
      <button
        onClick={() => handleAction('rejected')}
        disabled={!!loading}
        className="text-xs font-bold px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
      >
        {loading === 'rejected' ? '처리중...' : '거절'}
      </button>
    </div>
  )
}
