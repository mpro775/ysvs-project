import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../axios';
import { ENDPOINTS } from '../endpoints';
import type {
  ApiResponse,
  PaginatedResponse,
  ProfessionalVerification,
  ProfessionalVerificationReviewData,
  ProfessionalVerificationStatus,
  User,
} from '@/types';

interface VerificationFilters {
  page?: number;
  limit?: number;
  status?: ProfessionalVerificationStatus;
  search?: string;
}

export const useProfessionalVerifications = (filters?: VerificationFilters) => {
  return useQuery({
    queryKey: ['users', 'professional-verifications', filters],
    queryFn: async () => {
      const response = await api.get<unknown, PaginatedResponse<User>>(
        ENDPOINTS.USERS.PROFESSIONAL_VERIFICATIONS,
        { params: filters },
      );
      return response;
    },
  });
};

export const useMyProfessionalVerification = () => {
  return useQuery({
    queryKey: ['users', 'my-professional-verification'],
    queryFn: async () => {
      const response = await api.get<unknown, ApiResponse<ProfessionalVerification>>(
        ENDPOINTS.USERS.MY_PROFESSIONAL_VERIFICATION,
      );
      return response.data;
    },
  });
};

export const useUploadProfessionalVerification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post<unknown, ApiResponse<User>>(
        ENDPOINTS.USERS.UPLOAD_PROFESSIONAL_VERIFICATION,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );
      return response.data;
    },
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ['users', 'my-professional-verification'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'professional-verifications'] });
      queryClient.setQueryData(['auth', 'me'], user);
      toast.success('تم رفع بطاقة المزاولة وإرسالها للمراجعة.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'تعذر رفع بطاقة المزاولة حالياً.');
    },
  });
};

export const useReviewProfessionalVerification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      payload,
    }: {
      userId: string;
      payload: ProfessionalVerificationReviewData;
    }) => {
      const response = await api.patch<unknown, ApiResponse<User>>(
        ENDPOINTS.USERS.REVIEW_PROFESSIONAL_VERIFICATION(userId),
        payload,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'professional-verifications'] });
      toast.success('تم تحديث حالة التوثيق بنجاح.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'تعذر تحديث حالة التوثيق حالياً.');
    },
  });
};
