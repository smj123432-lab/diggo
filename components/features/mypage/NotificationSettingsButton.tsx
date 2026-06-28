'use client'

// 알림 설정 버튼 — 클릭 시 NotificationSettingsModal 열기
import { useState } from 'react'
import { NotificationSettingsModal } from './NotificationSettingsModal'

export function NotificationSettingsButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-blue-50 transition-colors group text-left"
      >
        <span className="w-8 h-8 rounded-lg bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors shrink-0">
          <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </span>
        <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">알림 설정</span>
        <svg className="w-4 h-4 text-gray-300 ml-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      <NotificationSettingsModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
