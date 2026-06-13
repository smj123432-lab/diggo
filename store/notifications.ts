import { create } from 'zustand'
import type { Notification } from '@/types'

interface NotificationState {
  unreadCount: number
  notifications: Notification[]
  setUnreadCount: (n: number) => void
  addNotification: (n: Notification) => void
  setNotifications: (list: Notification[]) => void
  markAllAsRead: () => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  notifications: [],
  setUnreadCount: (unreadCount) => set({ unreadCount }),
  addNotification: (n) =>
    set((state) => ({ notifications: [n, ...state.notifications] })),
  setNotifications: (notifications) => set({ notifications }),
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
    })),
}))
