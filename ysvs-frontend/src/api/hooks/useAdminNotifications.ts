import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../axios';
import { ENDPOINTS } from '../endpoints';
import type { AdminNotification, ApiResponse, PaginatedResponse } from '@/types';
import { useAdminNotificationsStore } from '@/stores/adminNotificationsStore';

interface AdminNotificationsFilters {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

export const useAdminNotifications = (filters?: AdminNotificationsFilters) => {
  const syncFromServer = useAdminNotificationsStore((state) => state.syncFromServer);

  const query = useQuery({
    queryKey: ['admin', 'notifications', filters],
    queryFn: async () => {
      const response = await api.get<unknown, PaginatedResponse<AdminNotification>>(
        ENDPOINTS.NOTIFICATIONS.BASE,
        { params: filters },
      );
      return response;
    },
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (query.data?.data) {
      syncFromServer(query.data.data);
    }
  }, [query.data?.data, syncFromServer]);

  return query;
};

export const useMarkAdminNotificationAsRead = () => {
  const queryClient = useQueryClient();
  const markAsRead = useAdminNotificationsStore((state) => state.markAsRead);

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch<unknown, ApiResponse<AdminNotification>>(
        ENDPOINTS.NOTIFICATIONS.MARK_READ(id),
      );
      return response.data;
    },
    onMutate: (id) => {
      markAsRead(id);
    },
    onSuccess: (notification) => {
      markAsRead(notification.id);
      queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] });
    },
  });
};

export const useMarkAllAdminNotificationsAsRead = () => {
  const queryClient = useQueryClient();
  const markAllAsRead = useAdminNotificationsStore((state) => state.markAllAsRead);

  return useMutation({
    mutationFn: async () => {
      const response = await api.patch<unknown, ApiResponse<{ updated: number }>>(
        ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ,
      );
      return response.data;
    },
    onMutate: () => {
      markAllAsRead();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] });
    },
  });
};
