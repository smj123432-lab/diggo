'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth'
import { useNotificationStore } from '@/store/notifications'
import type { Notification } from '@/types'

export function useNotifications() {
  const { user } = useAuthStore()
  const { setUnreadCount, addNotification, setNotifications } = useNotificationStore()
  const pathname = usePathname()

  // 현재 경로를 ref로 유지 — Realtime 콜백 클로저에서 최신값 참조 (ChatSplitLayout의 activeRoomIdRef 패턴)
  const pathnameRef = useRef(pathname)
  useEffect(() => {
    pathnameRef.current = pathname
  }, [pathname])

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
        const unread = data.filter((n: Notification) => !n.is_read).length
        setUnreadCount(unread)
      })
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
          if (pathnameRef.current !== '/notifications') {
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
