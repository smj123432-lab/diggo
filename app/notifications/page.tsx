'use client'

// 알림 목록 페이지 — Zustand store에서 읽어 렌더링, 진입 시 전체 읽음 처리
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { useNotificationStore } from '@/store/notifications'
import { EmptyState } from '@/components/ui/EmptyState'
import type { NotificationType } from '@/types'
import { formatLongDate } from '@/lib/utils/date'

const TYPE_CONFIG: Record<NotificationType | string, { icon: React.ReactNode; bg: string }> = {
  new_application: {
    icon: (
      <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    bg: 'bg-blue-50',
  },
  application_accepted: {
    icon: (
      <svg className="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    bg: 'bg-emerald-50',
  },
  application_rejected: {
    icon: (
      <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" strokeLinecap="round" />
        <line x1="9" y1="9" x2="15" y2="15" strokeLinecap="round" />
      </svg>
    ),
    bg: 'bg-red-50',
  },
}

const DEFAULT_CONFIG = {
  icon: (
    <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  bg: 'bg-gray-50',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '방금 전'
  if (mins < 60) return `${mins}분 전`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}일 전`
  return formatLongDate(dateStr)
}

// 알림 타입별 이동 경로
function getNotificationHref(type: NotificationType | string): string {
  switch (type) {
    case 'new_application': return '/manager'
    case 'application_accepted':
    case 'application_rejected':
    case 'application_cancelled': return '/mypage'
    default: return '/mypage'
  }
}

export default function NotificationsPage() {
  const { user, isLoading } = useAuthStore()
  const { notifications, setUnreadCount, markAllAsRead } = useNotificationStore()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login')
  }, [user, isLoading, router])

  // 페이지 진입 시 전체 읽음 처리 (store + DB)
  useEffect(() => {
    if (!user) return
    setUnreadCount(0)
    markAllAsRead()
    fetch('/api/notifications/read', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
  }, [user, setUnreadCount, markAllAsRead])

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-lg mx-auto px-4 py-5 space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-[72px] animate-pulse border border-gray-100" />
          ))}
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            aria-label="뒤로가기"
            className="p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span className="flex-1 text-sm font-semibold text-gray-700">알림</span>
        </div>
      </div>

      {/* 본문 */}
      <div className="max-w-lg mx-auto px-4 py-5">
        {notifications.length === 0 ? (
          <EmptyState
            icon={
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
            }
            title="새로운 알림이 없습니다."
            className="py-24"
          />
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => {
              const config = TYPE_CONFIG[n.type] ?? DEFAULT_CONFIG
              return (
                <div
                  key={n.id}
                  onClick={() => router.push(getNotificationHref(n.type))}
                  className={`rounded-2xl p-4 border transition-colors cursor-pointer ${
                    n.is_read
                      ? 'bg-white border-gray-100 hover:bg-gray-50'
                      : 'bg-blue-50 border-blue-100 hover:bg-blue-100'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-xl ${config.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                      {config.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${n.is_read ? 'text-gray-600 font-normal' : 'text-gray-900 font-medium'}`}>
                        {n.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                    {!n.is_read && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
