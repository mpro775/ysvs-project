import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../axios';
import { ENDPOINTS } from '../endpoints';
import type { ApiResponse, StreamConfig, StreamStatus } from '@/types';

// Get stream status (public)
export const useStreamStatus = () => {
  return useQuery({
    queryKey: ['streaming', 'status'],
    queryFn: async () => {
      const response = await api.get<unknown, ApiResponse<StreamStatus>>(
        ENDPOINTS.STREAMING.STATUS
      );
      return response.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider stale after 10 seconds
  });
};

// Get stream config (admin)
export const useStreamConfig = () => {
  return useQuery({
    queryKey: ['streaming', 'config'],
    queryFn: async () => {
      const response = await api.get<unknown, ApiResponse<StreamConfig>>(
        ENDPOINTS.STREAMING.CONFIG
      );
      return response.data;
    },
  });
};

// Create stream config
export const useCreateStreamConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      embedUrl: string;
      title: string;
      titleEn?: string;
      event?: string;
    }) => {
      const response = await api.post<unknown, ApiResponse<StreamConfig>>(
        ENDPOINTS.STREAMING.CONFIG,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streaming'] });
      toast.success('تم إنشاء إعدادات البث');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'فشل إنشاء إعدادات البث');
    },
  });
};

// Update stream config
export const useUpdateStreamConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<{
        embedUrl: string;
        title: string;
        titleEn?: string;
        event?: string;
      }>;
    }) => {
      const response = await api.patch<unknown, ApiResponse<StreamConfig>>(
        ENDPOINTS.STREAMING.CONFIG_BY_ID(id),
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streaming'] });
      toast.success('تم تحديث إعدادات البث');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'فشل تحديث إعدادات البث');
    },
  });
};

// Start stream
export const useStartStream = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (configId: string) => {
      const response = await api.post<unknown, ApiResponse<StreamConfig>>(
        ENDPOINTS.STREAMING.START(configId)
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streaming'] });
      toast.success('تم بدء البث المباشر');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'فشل بدء البث');
    },
  });
};

// Stop stream
export const useStopStream = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (configId?: string) => {
      const response = await api.post<unknown, ApiResponse<{ message: string }>>(
        ENDPOINTS.STREAMING.STOP,
        {},
        { params: configId ? { configId } : {} }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streaming'] });
      toast.success('تم إيقاف البث المباشر');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'فشل إيقاف البث');
    },
  });
};

// Get stream history
export const useStreamHistory = (limit?: number) => {
  return useQuery({
    queryKey: ['streaming', 'history', limit],
    queryFn: async () => {
      const response = await api.get<unknown, ApiResponse<StreamConfig[]>>(
        ENDPOINTS.STREAMING.HISTORY,
        { params: { limit } }
      );
      return response.data;
    },
  });
};

// Get viewer count
export const useViewerCount = () => {
  return useQuery({
    queryKey: ['streaming', 'viewers'],
    queryFn: async () => {
      try {
        const response = await api.get<unknown, ApiResponse<{ count: number }>>(
          ENDPOINTS.STREAMING.VIEWERS
        );
        return response?.data?.count ?? 0;
      } catch {
        return 0;
      }
    },
    refetchInterval: 10000, // Refetch every 10 seconds
    staleTime: 5000,
  });
};
