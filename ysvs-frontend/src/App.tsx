import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { router } from './router';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useCurrentUser } from '@/api/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { applyTheme, watchSystemTheme } from '@/lib/theme';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ThemeInitializer() {
  const { theme } = useUIStore();

  useEffect(() => {
    applyTheme(theme);

    if (theme !== 'system') {
      return;
    }

    return watchSystemTheme(() => {
      applyTheme('system');
    });
  }, [theme]);

  return null;
}

function AppInitializer() {
  const setUser = useAuthStore((state) => state.setUser);
  const { data: currentUser } = useCurrentUser();

  useEffect(() => {
    document.documentElement.setAttribute('lang', 'ar');
    document.documentElement.setAttribute('dir', 'rtl');
    document.body.setAttribute('dir', 'rtl');
  }, []);

  useEffect(() => {
    if (currentUser) {
      setUser(currentUser);
    }
  }, [currentUser, setUser]);

  return null;
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeInitializer />
        <AppInitializer />
        <RouterProvider router={router} />
        <Toaster position="top-center" richColors closeButton />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
