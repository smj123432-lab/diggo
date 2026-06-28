'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth'
import { useNotificationStore } from '@/store/notifications'
import type { Notification } from '@/types'

const isOnNotificationsPage = () =>
  typeof window !== 'undefined' && window.location.pathname === '/notifications'

// localStorage 알림 설정에서 해당 type이 활성화되어 있는지 확인
function isNotificationEnabled(type: string): boolean {
  try {
    const raw = localStorage.getItem('diggo:notification_settings')
    if (!raw) return true
    const settings = JSON.parse(raw) as Record<string, boolean>
    return settings[type] !== false
  } catch {
    return true
  }
}

export function useNotifications() {
  const { user } = useAuthStore()
  const { setUnreadCount, addNotification, setNotifications } = useNotificationStore()

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
        // /notifications 페이지가 markAllAsRead + setUnreadCount(0)을 동시에 호출하므로
        // 이미 해당 페이지에 있을 때 unreadCount를 덮어쓰면 배지가 깜빡인다
        if (!isOnNotificationsPage()) {
          const unread = data.filter((n: Notification) => !n.is_read).length
          setUnreadCount(unread)
        }
      })
      .catch(() => {})
  }, [user, setNotifications, setUnreadCount])

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
          // 알림 설정에서 해당 type이 꺼져 있으면 무시
          if (!isNotificationEnabled(newNotification.type)) return
          addNotification(newNotification)
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
