import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

/**
 * يوجّه /dashboard إلى لوحة التحكم المناسبة حسب دور المستخدم:
 * أدمن/سوبر أدمن → /admin، عضو → /member، غير مسجل → /login
 */
export function DashboardRedirect() {
  const { isAuthenticated, isAdmin } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (isAdmin()) {
    return <Navigate to="/admin" replace />;
  }
  return <Navigate to="/member" replace />;
}
