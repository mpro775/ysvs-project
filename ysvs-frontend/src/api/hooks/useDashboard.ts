import { useQuery } from '@tanstack/react-query';
import api from '../axios';
import { ENDPOINTS } from '../endpoints';
import type { ApiResponse, DashboardStats, Activity } from '@/types';

interface DashboardStatsOptions {
  staleTime?: number;
  refetchInterval?: number;
}

// Get dashboard stats
export const useDashboardStats = (options?: DashboardStatsOptions) => {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const response = await api.get<unknown, ApiResponse<DashboardStats>>(
        ENDPOINTS.DASHBOARD.STATS
      );
      return response.data;
    },
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutes
    refetchInterval: options?.refetchInterval,
  });
};

// Get recent activities
export const useRecentActivities = (limit: number = 10) => {
  return useQuery({
    queryKey: ['dashboard', 'activities', limit],
    queryFn: async () => {
      const response = await api.get<unknown, ApiResponse<Activity[]>>(
        ENDPOINTS.DASHBOARD.ACTIVITIES,
        { params: { limit } }
      );
      return response.data;
    },
    staleTime: 60 * 1000, // 1 minute
  });
};
