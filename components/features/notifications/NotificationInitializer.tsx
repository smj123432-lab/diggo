'use client'

import { useNotifications } from '@/hooks/useNotifications'

// 앱 전역에서 알림 Realtime을 한 번만 구독해 Zustand store에 동기화
export function NotificationInitializer() {
  useNotifications()
  return null
}
