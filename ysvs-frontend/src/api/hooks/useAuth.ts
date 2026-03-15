import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../axios';
import { ENDPOINTS } from '../endpoints';
import type {
  ApiResponse,
  AuthResponse,
  LoginCredentials,
  RegisterData,
  User,
} from '@/types';
import { useAuthStore } from '@/stores/authStore';

// Login mutation
export const useLogin = () => {
  const { login } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await api.post<unknown, ApiResponse<AuthResponse>>(
        ENDPOINTS.AUTH.LOGIN,
        credentials
      );
      return response.data;
    },
    onSuccess: (data) => {
      login(data.user, data.accessToken, data.refreshToken);
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      toast.success('تم تسجيل الدخول بنجاح.');

      const linkedRegistrations = data.guestLinkResult?.registrationsLinked || 0;
      const linkedCertificates = data.guestLinkResult?.certificatesLinked || 0;
      const skippedConflicts = data.guestLinkResult?.skippedRegistrationConflicts || 0;

      if (linkedRegistrations > 0 || linkedCertificates > 0) {
        toast.success(
          `تم استيراد سجلاتك السابقة بنجاح: ${linkedRegistrations} تسجيل و ${linkedCertificates} شهادة.`
        );
      }

      if (skippedConflicts > 0) {
        toast.warning(
          `تعذر ربط ${skippedConflicts} تسجيل بسبب وجود تسجيلات لنفس المؤتمر في حسابك.`
        );
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'تعذر تسجيل الدخول حالياً.');
    },
  });
};

// Register mutation
export const useRegister = () => {
  return useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await api.post<unknown, ApiResponse<AuthResponse>>(
        ENDPOINTS.AUTH.REGISTER,
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('تم إنشاء الحساب بنجاح.');

      const linkedRegistrations = data.guestLinkResult?.registrationsLinked || 0;
      const linkedCertificates = data.guestLinkResult?.certificatesLinked || 0;

      if (linkedRegistrations > 0 || linkedCertificates > 0) {
        toast.success(
          `تم ربط سجل الضيف تلقائياً بنجاح: ${linkedRegistrations} تسجيل و ${linkedCertificates} شهادة.`
        );
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'تعذر إنشاء الحساب حالياً.');
    },
  });
};

// Logout mutation
export const useLogout = () => {
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.post(ENDPOINTS.AUTH.LOGOUT);
    },
    onSuccess: () => {
      logout();
      queryClient.clear();
      toast.success('تم تسجيل الخروج بنجاح.');
    },
    onError: () => {
      // Even if the API call fails, log out locally
      logout();
      queryClient.clear();
    },
  });
};

// Get current user
export const useCurrentUser = () => {
  const { token } = useAuthStore();

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const response = await api.get<unknown, ApiResponse<User>>(ENDPOINTS.AUTH.ME);
      return response.data;
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Forgot password mutation
export const useForgotPassword = () => {
  return useMutation({
    mutationFn: async (email: string) => {
      const response = await api.post<unknown, ApiResponse<{ message: string }>>(
        ENDPOINTS.AUTH.FORGOT_PASSWORD,
        { email }
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني بنجاح.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'تعذر إرسال رابط إعادة التعيين حالياً.');
    },
  });
};

// Reset password mutation
export const useResetPassword = () => {
  return useMutation({
    mutationFn: async (data: { token: string; password: string }) => {
      const response = await api.post<unknown, ApiResponse<{ message: string }>>(
        ENDPOINTS.AUTH.RESET_PASSWORD,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success('تمت إعادة تعيين كلمة المرور بنجاح.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'تعذر إعادة تعيين كلمة المرور حالياً.');
    },
  });
};

// Change password mutation
export const useChangePassword = () => {
  return useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await api.post<unknown, ApiResponse<{ message: string }>>(
        ENDPOINTS.AUTH.CHANGE_PASSWORD,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success('تم تغيير كلمة المرور بنجاح.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'تعذر تغيير كلمة المرور حالياً.');
    },
  });
};

// Update current profile
export const useUpdateProfile = () => {
  const { updateUser } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      fullNameAr?: string;
      fullNameEn?: string;
      phone?: string;
      gender?: 'male' | 'female';
      country?: string;
      jobTitle?: string;
      specialty?: string;
      workplace?: string;
    }) => {
      const response = await api.patch<unknown, ApiResponse<User>>(
        ENDPOINTS.AUTH.UPDATE_ME,
        data,
      );
      return response.data;
    },
    onSuccess: (user) => {
      updateUser(user);
      queryClient.setQueryData(['auth', 'me'], user);
      toast.success('تم تحديث الملف الشخصي بنجاح.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'تعذر تحديث الملف الشخصي حالياً.');
    },
  });
};
