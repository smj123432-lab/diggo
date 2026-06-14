'use client'

// 일감 상세 제목 영역 — 소장 전용 미니 상태 드롭다운 (당근마켓 스타일)
// open/closed: 수정 가능 드롭다운 / in_progress/completed/settled: 잠금 뱃지
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { JobStatus } from '@/types'

interface Props {
  jobId: string
  effectiveStatus: JobStatus
}

// 잠금 상태 뱃지 스타일
const LOCKED_BADGE: Partial<Record<JobStatus, { label: string; className: string }>> = {
  in_progress: { label: '🚚 작업중',           className: 'bg-blue-50 text-blue-700 border-blue-200' },
  completed:   { label: '🟡 작업완료(지급대기)', className: 'bg-emerald-50 text-emerald-700 border-purple-200' },
  settled:     { label: '🟢 정산완료',          className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
}

const EDITABLE_LABEL: Partial<Record<JobStatus, string>> = {
  open:   '모집중',
  closed: '모집 마감',
}

export function JobStatusBadge({ jobId, effectiveStatus }: Props) {
  const router = useRouter()
  const [current, setCurrent] = useState<JobStatus>(effectiveStatus)
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const lockedBadge = LOCKED_BADGE[current]

  function openDropdown() {
    if (!btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    setDropdownPos({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX })
    setIsOpen(true)
  }

  useEffect(() => {
    if (!isOpen) return
    function onOutside(e: MouseEvent) {
      const t = e.target as Node
      if (!btnRef.current?.contains(t) && !dropdownRef.current?.contains(t)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [isOpen])

  async function handleSelect(next: JobStatus) {
    if (next === current || isLoading) return
    const prev = current
    setIsOpen(false)
    setCurrent(next)
    setIsLoading(true)
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      if (!res.ok) {
        setCurrent(prev)
        throw new Error((await res.json()).error ?? '요청 실패')
      }
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '상태 변경에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 잠금 상태 — 정적 배지
  if (lockedBadge) {
    return (
      <span className={`inline-flex items-center px-2.5 py-1 border rounded-md text-xs font-semibold ${lockedBadge.className}`}>
        {lockedBadge.label}
      </span>
    )
  }

  // 편집 가능 상태 (open / closed) — 드롭다운 버튼
  return (
    <>
      <button
        ref={btnRef}
        onClick={openDropdown}
        disabled={isLoading}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 border rounded-md text-xs font-semibold hover:opacity-80 transition-opacity disabled:opacity-50 ${
          current === 'open'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-gray-100 text-gray-500 border-gray-200'
        }`}
      >
        {EDITABLE_LABEL[current]}
        <svg
          className={`w-3 h-3 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          role="listbox"
          style={{ position: 'absolute', top: dropdownPos.top, left: dropdownPos.left, zIndex: 9999 }}
          className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden min-w-[120px]"
        >
          {(['open', 'closed'] as JobStatus[]).map(s => (
            <button
              key={s}
              role="option"
              aria-selected={current === s}
              onClick={() => handleSelect(s)}
              className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50 ${
                current === s ? 'text-emerald-700 bg-emerald-50' : 'text-gray-700'
              }`}
            >
              {EDITABLE_LABEL[s]}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  )
}
