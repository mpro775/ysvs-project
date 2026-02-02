import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../axios';
import { ENDPOINTS } from '../endpoints';
import type { ApiResponse, Certificate, PaginatedResponse } from '@/types';

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
      const response = await api.get(ENDPOINTS.CERTIFICATES.DOWNLOAD(id), {
        responseType: 'blob',
      });
      return response as unknown as Blob;
    },
    onSuccess: (blob, id) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('تم تحميل الشهادة');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'فشل تحميل الشهادة');
    },
  });
};

// Generate single certificate
export const useGenerateCertificate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (registrationId: string) => {
      const response = await api.post<unknown, ApiResponse<Certificate>>(
        ENDPOINTS.CERTIFICATES.GENERATE,
        { registrationId }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      toast.success('تم إصدار الشهادة بنجاح');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'فشل إصدار الشهادة');
    },
  });
};

// Bulk generate certificates
export const useBulkGenerateCertificates = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      registrationIds,
    }: {
      eventId: string;
      registrationIds: string[];
    }) => {
      const response = await api.post<
        unknown,
        ApiResponse<{ generated: number; failed: number; certificates: Certificate[] }>
      >(ENDPOINTS.CERTIFICATES.BULK_GENERATE, {
        eventId,
        registrationIds,
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      toast.success(`تم إصدار ${data.generated} شهادة بنجاح`);
      if (data.failed > 0) {
        toast.warning(`فشل إصدار ${data.failed} شهادة`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'فشل إصدار الشهادات');
    },
  });
};

// Revoke certificate
export const useRevokeCertificate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await api.post<unknown, ApiResponse<Certificate>>(
        ENDPOINTS.CERTIFICATES.REVOKE(id),
        { reason }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      toast.success('تم إلغاء الشهادة');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'فشل إلغاء الشهادة');
    },
  });
};
