import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AdminNotification } from '@/types';

const MAX_NOTIFICATIONS = 100;

interface AdminNotificationsState {
  items: AdminNotification[];
  unreadCount: number;
  isConnected: boolean;
  upsertNotification: (notification: AdminNotification) => void;
  syncFromServer: (notifications: AdminNotification[]) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clear: () => void;
  setConnected: (connected: boolean) => void;
}

function sortByCreatedAtDesc(notifications: AdminNotification[]): AdminNotification[] {
  return [...notifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

function computeUnreadCount(notifications: AdminNotification[]): number {
  return notifications.reduce((count, notification) => {
    return notification.isRead ? count : count + 1;
  }, 0);
}

export const useAdminNotificationsStore = create<AdminNotificationsState>()(
  persist(
    (set) => ({
      items: [],
      unreadCount: 0,
      isConnected: false,
      upsertNotification: (notification) =>
        set((state) => {
          const withoutCurrent = state.items.filter((item) => item.id !== notification.id);
          const next = sortByCreatedAtDesc([
            {
              ...notification,
              isRead: notification.isRead ?? false,
            },
            ...withoutCurrent,
          ]).slice(0, MAX_NOTIFICATIONS);

          return {
            items: next,
            unreadCount: computeUnreadCount(next),
          };
        }),
      syncFromServer: (notifications) =>
        set(() => {
          const sorted = sortByCreatedAtDesc(notifications).slice(0, MAX_NOTIFICATIONS);
          return {
            items: sorted,
            unreadCount: computeUnreadCount(sorted),
          };
        }),
      markAsRead: (id) =>
        set((state) => {
          const next = state.items.map((item) => {
            if (item.id !== id || item.isRead) {
              return item;
            }

            return {
              ...item,
              isRead: true,
              readAt: new Date().toISOString(),
            };
          });

          return {
            items: next,
            unreadCount: computeUnreadCount(next),
          };
        }),
      markAllAsRead: () =>
        set((state) => {
          const now = new Date().toISOString();
          const next = state.items.map((item) => ({
            ...item,
            isRead: true,
            readAt: item.readAt || now,
          }));

          return {
            items: next,
            unreadCount: 0,
          };
        }),
      clear: () =>
        set({
          items: [],
          unreadCount: 0,
        }),
      setConnected: (connected) => set({ isConnected: connected }),
    }),
    {
      name: 'ysvs-admin-notifications-store',
      partialize: (state) => ({
        items: state.items,
        unreadCount: state.unreadCount,
      }),
    },
  ),
);
