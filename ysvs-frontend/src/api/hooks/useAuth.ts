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
      toast.success('تم تسجيل الدخول بنجاح');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'فشل تسجيل الدخول');
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
    onSuccess: () => {
      toast.success('تم إنشاء الحساب بنجاح');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'فشل إنشاء الحساب');
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
      toast.success('تم تسجيل الخروج بنجاح');
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
      toast.success('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'فشل إرسال رابط إعادة التعيين');
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
      toast.success('تم إعادة تعيين كلمة المرور بنجاح');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'فشل إعادة تعيين كلمة المرور');
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
      toast.success('تم تغيير كلمة المرور بنجاح');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'فشل تغيير كلمة المرور');
    },
  });
};
