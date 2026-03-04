// API Endpoints
export const ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    CHANGE_PASSWORD: '/auth/change-password',
    VERIFY_EMAIL: '/auth/verify-email',
  },

  // Users
  USERS: {
    BASE: '/users',
    BY_ID: (id: string) => `/users/${id}`,
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
  },

  // Events
  EVENTS: {
    BASE: '/events',
    BY_ID: (id: string) => `/events/${id}`,
    BY_SLUG: (slug: string) => `/events/${slug}`,
    SLUG_AVAILABILITY: (slug: string) => `/events/slug-availability/${slug}`,
    UPCOMING: '/events/upcoming',
    FORM_SCHEMA: (id: string) => `/events/${id}/form-schema`,
    REGISTER: (id: string) => `/events/${id}/register`,
    REGISTER_UPLOAD: (id: string) => `/events/${id}/register/upload`,
    REGISTRATIONS: (id: string) => `/events/${id}/registrations`,
    MY_REGISTRATIONS: '/events/my-registrations',
    ATTENDANCE: (_eventId: string, registrationId: string) =>
      `/events/registrations/${registrationId}/attendance`,
  },

  // Certificates
  CERTIFICATES: {
    BASE: '/certificates',
    BY_ID: (id: string) => `/certificates/${id}`,
    VERIFY: (serial: string) => `/certificates/verify/${serial}`,
    MY_CERTIFICATES: '/certificates/my-certificates',
    DOWNLOAD: (id: string) => `/certificates/download/${id}`,
    GUEST_DOWNLOAD: (token: string) => `/certificates/guest-download?token=${encodeURIComponent(token)}`,
    GENERATE: '/certificates/generate',
    BULK_GENERATE: '/certificates/bulk-generate',
    REVOKE: (id: string) => `/certificates/${id}/revoke`,
    SEND_GUEST_EMAIL: (id: string) => `/certificates/${id}/send-guest-email`,
  },

  // Content (Articles)
  CONTENT: {
    ARTICLES: '/content/articles',
    ARTICLE_BY_ID: (id: string) => `/content/articles/${id}`,
    ARTICLE_BY_SLUG: (slug: string) => `/content/articles/${slug}`,
    CATEGORIES: '/content/categories',
  },

  // Board Members
  BOARD: {
    BASE: '/board/members',
    BY_ID: (id: string) => `/board/members/${id}`,
    REORDER: '/board/members/reorder',
  },

  // Streaming
  STREAMING: {
    STATUS: '/streaming/status',
    CONFIG: '/streaming/config',
    CONFIG_BY_ID: (id: string) => `/streaming/config/${id}`,
    START: (configId: string) => `/streaming/start/${configId}`,
    STOP: '/streaming/stop',
    HISTORY: '/streaming/history',
    VIEWERS: '/streaming/viewers',
  },

  // Media
  MEDIA: {
    UPLOAD: '/media/upload',
    BASE: '/media',
    BY_ID: (id: string) => `/media/${id}`,
  },

  // Dashboard
  DASHBOARD: {
    STATS: '/dashboard/stats',
    ACTIVITIES: '/dashboard/activities',
  },
} as const;
