import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.ysvs.smartagency-ye.com/api/v1';

let refreshPromise: Promise<string> | null = null;
let isRedirectingToLogin = false;

function shouldSkipRefresh(url?: string): boolean {
  if (!url) return false;
  return url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh');
}

function clearAuthState() {
  useAuthStore.getState().logout();
}

function redirectToLoginOnce() {
  if (isRedirectingToLogin) return;
  isRedirectingToLogin = true;
  window.location.href = '/login';
}

async function refreshAccessToken(currentRefreshToken: string): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(
        `${API_URL}/auth/refresh`,
        {},
        {
          headers: {
            Authorization: `Bearer ${currentRefreshToken}`,
          },
        }
      )
      .then((response) => {
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        useAuthStore.setState((state) => ({
          ...state,
          token: accessToken,
          refreshToken: newRefreshToken,
          isAuthenticated: true,
        }));

        return accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor - attach token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors and unwrap data
api.interceptors.response.use(
  (response) => {
    // Return the data directly if it's wrapped in a success response
    return response.data;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !shouldSkipRefresh(originalRequest.url)
    ) {
      originalRequest._retry = true;

      // Try to refresh the token
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const accessToken = await refreshAccessToken(refreshToken);

          // Retry the original request
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return api(originalRequest);
        } catch {
          // Refresh failed, clear tokens and redirect to login
          clearAuthState();
          redirectToLoginOnce();
        }
      } else {
        // No refresh token, redirect to login
        clearAuthState();
        redirectToLoginOnce();
      }
    }

    // Handle other errors
    const message =
      (error.response?.data as { message?: string })?.message ||
      error.message ||
      'حدث خطأ غير متوقع';

    return Promise.reject(new Error(message));
  }
);

export default api;
