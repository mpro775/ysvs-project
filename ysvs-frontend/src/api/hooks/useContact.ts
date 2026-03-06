import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../axios';
import { ENDPOINTS } from '../endpoints';
import type {
  ApiResponse,
  ContactMessage,
  ContactMessageStatus,
  PaginatedResponse,
} from '@/types';

interface SubmitContactMessageData {
  name: string;
  email: string;
  subject: string;
  message: string;
  source?: string;
  locale?: string;
  website?: string;
}

interface ContactMessagesFilters {
  page?: number;
  limit?: number;
  status?: ContactMessageStatus;
  isRead?: boolean;
  search?: string;
}

export const useSubmitContactMessage = () => {
  return useMutation({
    mutationFn: async (data: SubmitContactMessageData) => {
      const response = await api.post<
        unknown,
        ApiResponse<{ id: string; message: string }>
      >(ENDPOINTS.CONTACT.MESSAGES, data);
      return response;
    },
    onSuccess: (response) => {
      toast.success(response.data.message || 'تم استلام رسالتك بنجاح');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'تعذر إرسال الرسالة حالياً');
    },
  });
};

export const useContactMessages = (filters?: ContactMessagesFilters) => {
  return useQuery({
    queryKey: ['contact', 'messages', filters],
    queryFn: async () => {
      const response = await api.get<unknown, PaginatedResponse<ContactMessage>>(
        ENDPOINTS.CONTACT.MESSAGES,
        { params: filters },
      );
      return response;
    },
  });
};

export const useContactMessage = (id: string) => {
  return useQuery({
    queryKey: ['contact', 'message', id],
    queryFn: async () => {
      const response = await api.get<unknown, ApiResponse<ContactMessage>>(
        ENDPOINTS.CONTACT.BY_ID(id),
      );
      return response.data;
    },
    enabled: !!id,
  });
};

export const useUpdateContactMessageStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      assignedTo,
    }: {
      id: string;
      status: ContactMessageStatus;
      assignedTo?: string;
    }) => {
      const response = await api.patch<unknown, ApiResponse<ContactMessage>>(
        ENDPOINTS.CONTACT.UPDATE_STATUS(id),
        { status, assignedTo },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact', 'messages'] });
      toast.success('تم تحديث حالة الرسالة');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'تعذر تحديث الحالة');
    },
  });
};

export const useUpdateContactMessageRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isRead }: { id: string; isRead: boolean }) => {
      const response = await api.patch<unknown, ApiResponse<ContactMessage>>(
        ENDPOINTS.CONTACT.UPDATE_READ(id),
        { isRead },
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contact', 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['contact', 'message', variables.id] });
      toast.success('تم تحديث حالة القراءة');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'تعذر تحديث حالة القراءة');
    },
  });
};

export const useReplyContactMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      body,
      subject,
    }: {
      id: string;
      body: string;
      subject?: string;
    }) => {
      const response = await api.post<unknown, ApiResponse<{ sent: boolean; message: ContactMessage }>>(
        ENDPOINTS.CONTACT.REPLY(id),
        { body, subject },
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contact', 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['contact', 'message', variables.id] });
      toast.success('تم إرسال الرد بنجاح');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'تعذر إرسال الرد');
    },
  });
};
