import { createBrowserRouter } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { DashboardRedirect } from '@/components/shared/DashboardRedirect';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { UserRole } from '@/types';

// Layouts
const PublicLayout = lazy(() => import('@/components/layout/PublicLayout'));
const AdminLayout = lazy(() => import('@/components/layout/AdminLayout'));
const MemberLayout = lazy(() => import('@/components/layout/MemberLayout'));

// Public Pages
const HomePage = lazy(() => import('@/pages/public/HomePage'));
const AboutPage = lazy(() => import('@/pages/public/AboutPage'));
const NewsPage = lazy(() => import('@/pages/public/NewsPage'));
const NewsDetailPage = lazy(() => import('@/pages/public/NewsDetailPage'));
const EventsPage = lazy(() => import('@/pages/public/EventsPage'));
const EventDetailPage = lazy(() => import('@/pages/public/EventDetailPage'));
const ContactPage = lazy(() => import('@/pages/public/ContactPage'));
const VerifyPage = lazy(() => import('@/pages/public/VerifyPage'));
const LoginPage = lazy(() => import('@/pages/public/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/public/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/public/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/public/ResetPasswordPage'));
const NotFoundPage = lazy(() => import('@/pages/public/NotFoundPage'));

// Admin Pages
const AdminDashboardPage = lazy(() => import('@/pages/admin/DashboardPage'));
const AdminEventsPage = lazy(() => import('@/pages/admin/EventsPage'));
const AdminEventCreatePage = lazy(() => import('@/pages/admin/EventCreatePage'));
const AdminEventEditPage = lazy(() => import('@/pages/admin/EventEditPage'));
const AdminEventRegistrantsPage = lazy(() => import('@/pages/admin/EventRegistrantsPage'));
const AdminCertificatesPage = lazy(() => import('@/pages/admin/CertificatesPage'));
const AdminIssueCertificatesPage = lazy(() => import('@/pages/admin/IssueCertificatesPage'));
const AdminStreamingPage = lazy(() => import('@/pages/admin/StreamingPage'));
const AdminArticlesPage = lazy(() => import('@/pages/admin/ArticlesPage'));
const AdminArticleEditorPage = lazy(() => import('@/pages/admin/ArticleEditorPage'));
const AdminMembersPage = lazy(() => import('@/pages/admin/MembersPage'));
const AdminBoardPage = lazy(() => import('@/pages/admin/BoardPage'));
const AdminMediaPage = lazy(() => import('@/pages/admin/MediaPage'));
const AdminSettingsPage = lazy(() => import('@/pages/admin/SettingsPage'));

// Member Pages
const MemberDashboardPage = lazy(() => import('@/pages/member/DashboardPage'));
const MemberProfilePage = lazy(() => import('@/pages/member/ProfilePage'));
const MemberEventsPage = lazy(() => import('@/pages/member/MyEventsPage'));
const MemberCertificatesPage = lazy(() => import('@/pages/member/MyCertificatesPage'));

// Wrapper for lazy components
const LazyWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

export const router = createBrowserRouter([
  // Public Routes
  {
    path: '/',
    element: (
      <LazyWrapper>
        <PublicLayout />
      </LazyWrapper>
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'news', element: <NewsPage /> },
      { path: 'news/:slug', element: <NewsDetailPage /> },
      { path: 'events', element: <EventsPage /> },
      { path: 'events/:slug', element: <EventDetailPage /> },
      { path: 'contact', element: <ContactPage /> },
      { path: 'verify', element: <VerifyPage /> },
      { path: 'verify/:serial', element: <VerifyPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: 'reset-password/:token', element: <ResetPasswordPage /> },
    ],
  },

  // Admin Routes
  {
    path: '/admin',
    element: (
      <LazyWrapper>
        <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN, UserRole.ADMIN]} />
      </LazyWrapper>
    ),
    children: [
      {
        element: (
          <LazyWrapper>
            <AdminLayout />
          </LazyWrapper>
        ),
        children: [
          { index: true, element: <AdminDashboardPage /> },
          { path: 'events', element: <AdminEventsPage /> },
          { path: 'events/create', element: <AdminEventCreatePage /> },
          { path: 'events/:id/edit', element: <AdminEventEditPage /> },
          { path: 'events/:id/registrants', element: <AdminEventRegistrantsPage /> },
          { path: 'certificates', element: <AdminCertificatesPage /> },
          { path: 'certificates/issue', element: <AdminIssueCertificatesPage /> },
          { path: 'streaming', element: <AdminStreamingPage /> },
          { path: 'articles', element: <AdminArticlesPage /> },
          { path: 'articles/create', element: <AdminArticleEditorPage /> },
          { path: 'articles/:id/edit', element: <AdminArticleEditorPage /> },
          { path: 'members', element: <AdminMembersPage /> },
          { path: 'board', element: <AdminBoardPage /> },
          { path: 'media', element: <AdminMediaPage /> },
          { path: 'settings', element: <AdminSettingsPage /> },
        ],
      },
    ],
  },

  // Member Routes
  {
    path: '/member',
    element: (
      <LazyWrapper>
        <ProtectedRoute allowedRoles={[UserRole.MEMBER, UserRole.ADMIN, UserRole.SUPER_ADMIN]} />
      </LazyWrapper>
    ),
    children: [
      {
        element: (
          <LazyWrapper>
            <MemberLayout />
          </LazyWrapper>
        ),
        children: [
          { index: true, element: <MemberDashboardPage /> },
          { path: 'profile', element: <MemberProfilePage /> },
          { path: 'events', element: <MemberEventsPage /> },
          { path: 'certificates', element: <MemberCertificatesPage /> },
        ],
      },
    ],
  },

  // Redirect /dashboard to appropriate dashboard (admin → /admin, member → /member)
  {
    path: '/dashboard',
    element: <DashboardRedirect />,
  },

  // 404
  {
    path: '*',
    element: (
      <LazyWrapper>
        <NotFoundPage />
      </LazyWrapper>
    ),
  },
]);
