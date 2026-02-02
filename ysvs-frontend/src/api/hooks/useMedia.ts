import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../axios';
import { ENDPOINTS } from '../endpoints';
import type { ApiResponse, PaginatedResponse } from '@/types';

export interface MediaItem {
  _id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  alt?: string;
  folder?: string;
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface MediaFilters {
  page?: number;
  limit?: number;
  folder?: string;
  mimeType?: string;
}

// Get all media
export const useMedia = (filters?: MediaFilters) => {
  return useQuery({
    queryKey: ['media', filters],
    queryFn: async () => {
      const response = await api.get<unknown, PaginatedResponse<MediaItem>>(
        ENDPOINTS.MEDIA.BASE,
        { params: filters }
      );
      return response;
    },
  });
};

// Upload media
export const useUploadMedia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post<unknown, ApiResponse<MediaItem>>(
        ENDPOINTS.MEDIA.UPLOAD,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      toast.success('تم رفع الملف بنجاح');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'فشل رفع الملف');
    },
  });
};

// Upload multiple media
export const useUploadMultipleMedia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await api.post<unknown, ApiResponse<MediaItem[]>>(
        ENDPOINTS.MEDIA.UPLOAD,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      toast.success('تم رفع الملفات بنجاح');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'فشل رفع الملفات');
    },
  });
};

// Delete media
export const useDeleteMedia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(ENDPOINTS.MEDIA.BY_ID(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      toast.success('تم حذف الملف بنجاح');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'فشل حذف الملف');
    },
  });
};
