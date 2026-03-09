import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../axios';
import { ENDPOINTS } from '../endpoints';
import type { ApiResponse, Certificate, PaginatedResponse } from '@/types';

const API_URL =
  import.meta.env.VITE_API_URL || 'https://api.ysvs.smartagency-ye.com/api/v1';

interface CertificateFilters {
  page?: number;
  limit?: number;
  search?: string;
  eventId?: string;
  isValid?: boolean;
}

interface VerifyResult {
  valid: boolean;
  certificate?: Certificate;
  message?: string;
}

// Get all certificates (admin)
export const useCertificates = (filters?: CertificateFilters) => {
  return useQuery({
    queryKey: ['certificates', filters],
    queryFn: async () => {
      const response = await api.get<unknown, PaginatedResponse<Certificate>>(
        ENDPOINTS.CERTIFICATES.BASE,
        { params: filters }
      );
      return response;
    },
  });
};

// Get my certificates
export const useMyCertificates = () => {
  return useQuery({
    queryKey: ['certificates', 'my'],
    queryFn: async () => {
      const response = await api.get<unknown, ApiResponse<Certificate[]>>(
        ENDPOINTS.CERTIFICATES.MY_CERTIFICATES
      );
      return response.data;
    },
  });
};

// Verify certificate
export const useVerifyCertificate = (serial: string) => {
  return useQuery({
    queryKey: ['certificates', 'verify', serial],
    queryFn: async () => {
      const response = await api.get<unknown, ApiResponse<VerifyResult>>(
        ENDPOINTS.CERTIFICATES.VERIFY(serial)
      );
      return response.data;
    },
    enabled: !!serial && serial.length > 5,
  });
};

// Download certificate
export const useDownloadCertificate = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}${ENDPOINTS.CERTIFICATES.DOWNLOAD(id)}`, {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : undefined,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'تعذر تحميل الشهادة حالياً.');
      }

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const payload = (await response.json()) as {
          success?: boolean;
          data?: { downloadUrl?: string; filename?: string };
          message?: string;
        };

        const downloadUrl = payload.data?.downloadUrl;
        if (!downloadUrl) {
          throw new Error(payload.message || 'رابط التحميل غير متاح');
        }

        return {
          mode: 'url' as const,
          downloadUrl,
          filename: payload.data?.filename || `certificate-${id}.pdf`,
        };
      }

      const blob = await response.blob();
      return {
        mode: 'blob' as const,
        blob,
        filename: `certificate-${id}.pdf`,
      };
    },
    onSuccess: (result) => {
      if (result.mode === 'url') {
        const a = document.createElement('a');
        a.href = result.downloadUrl;
        a.target = '_blank';
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
         toast.success('تم فتح رابط الشهادة بنجاح.');
        return;
      }

      const url = URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('تم تحميل الشهادة بنجاح.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'تعذر تحميل الشهادة حالياً.');
    },
  });
};

// Generate single certificate
export const useGenerateCertificate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (registrationId: string) => {
      const response = await api.post<unknown, ApiResponse<Certificate>>(
        ENDPOINTS.CERTIFICATES.GENERATE(registrationId),
        {}
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      toast.success('تم إصدار الشهادة بنجاح.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'تعذر إصدار الشهادة حالياً.');
    },
  });
};

// Bulk generate certificates
export const useBulkGenerateCertificates = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      templateId,
      registrationIds,
    }: {
      eventId: string;
      templateId?: string;
      registrationIds: string[];
    }) => {
      const response = await api.post<
        unknown,
        ApiResponse<{ generated: number; skipped: number; errors: string[] }>
      >(
        ENDPOINTS.CERTIFICATES.BULK_GENERATE(eventId),
        { templateId, registrationIds }
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      toast.success(`تم إصدار ${data.generated} شهادة بنجاح.`);
      if (data.skipped > 0) {
        toast.warning(`تم تخطي ${data.skipped} تسجيل (قد تكون الشهادة موجودة مسبقاً).`);
      }
      if (data.errors.length > 0) {
        toast.error(`حدثت ${data.errors.length} أخطاء أثناء الإصدار.`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'تعذر إصدار الشهادات حالياً.');
    },
  });
};

// Revoke certificate
export const useRevokeCertificate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await api.patch<unknown, ApiResponse<Certificate>>(
        ENDPOINTS.CERTIFICATES.REVOKE(id),
        { reason }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      toast.success('تم إلغاء الشهادة بنجاح.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'تعذر إلغاء الشهادة حالياً.');
    },
  });
};

export const useSendGuestCertificateEmail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post<unknown, ApiResponse<{ sent: boolean }>>(
        ENDPOINTS.CERTIFICATES.SEND_GUEST_EMAIL(id)
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      toast.success('تم إرسال رابط الشهادة للضيف بنجاح.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'تعذر إرسال بريد الشهادة حالياً.');
    },
  });
};
