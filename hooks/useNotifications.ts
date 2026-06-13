'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth'
import { useNotificationStore } from '@/store/notifications'
import type { Notification } from '@/types'

// usePathname() 대신 window.location.pathname 사용 — PPR 모드에서 usePathname이
// Suspense 밖에서 동적 데이터로 인식되어 prerender 실패를 일으킴
const isOnNotificationsPage = () =>
  typeof window !== 'undefined' && window.location.pathname === '/notifications'

export function useNotifications() {
  const { user } = useAuthStore()
  const { setUnreadCount, addNotification, setNotifications } = useNotificationStore()

  // 초기 알림 목록 + 미읽음 개수 로드
  useEffect(() => {
    if (!user) {
      setNotifications([])
      setUnreadCount(0)
      return
    }

    fetch('/api/notifications')
      .then((r) => r.json())
      .then(({ data }) => {
        if (!Array.isArray(data)) return
        setNotifications(data)
        // /notifications 페이지 열람 중이면 unreadCount 설정하지 않음
        // (페이지가 동시에 markAllAsRead + setUnreadCount(0)을 호출하므로 덮어쓰기 방지)
        if (!isOnNotificationsPage()) {
          const unread = data.filter((n: Notification) => !n.is_read).length
          setUnreadCount(unread)
        }
      })
      .catch(() => {})
  }, [user, setNotifications, setUnreadCount])

  // Realtime INSERT 구독 — 새 알림 실시간 수신
  useEffect(() => {
    if (!user) return

    const supabase = createClient()
    const channel = supabase
      .channel(`notifications:${user.id}:${Math.random().toString(36).slice(2, 9)}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification
          addNotification(newNotification)
          // /notifications 페이지를 보고 있으면 unreadCount 증가하지 않음
          // (페이지를 열고 있다는 것 자체가 이미 읽고 있다는 의미)
          if (!isOnNotificationsPage()) {
            setUnreadCount(useNotificationStore.getState().unreadCount + 1)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, addNotification, setUnreadCount])
}
