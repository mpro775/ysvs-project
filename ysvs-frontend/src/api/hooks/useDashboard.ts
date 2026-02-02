import { useQuery } from '@tanstack/react-query';
import api from '../axios';
import { ENDPOINTS } from '../endpoints';
import type { ApiResponse, DashboardStats, Activity } from '@/types';

// Get dashboard stats
export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const response = await api.get<unknown, ApiResponse<DashboardStats>>(
        ENDPOINTS.DASHBOARD.STATS
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
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
