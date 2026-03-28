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
    UPDATE_ME: '/auth/me',
    VERIFY_EMAIL: '/auth/verify-email',
  },

  // Users
  USERS: {
    BASE: '/users',
    BY_ID: (id: string) => `/users/${id}`,
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    PROFESSIONAL_VERIFICATIONS: '/users/professional-verifications',
    MY_PROFESSIONAL_VERIFICATION: '/users/me/professional-verification',
    UPLOAD_PROFESSIONAL_VERIFICATION: '/users/me/professional-verification/upload',
    REVIEW_PROFESSIONAL_VERIFICATION: (id: string) =>
      `/users/${id}/professional-verification/review`,
  },

  // Events
  EVENTS: {
    BASE: '/events',
    ALL: '/events/all',
    BY_ID: (id: string) => `/events/id/${id}`,
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
    GENERATE: (registrationId: string) => `/certificates/generate/${registrationId}`,
    BULK_GENERATE: (eventId: string) => `/certificates/generate-bulk/${eventId}`,
    REVOKE: (id: string) => `/certificates/${id}/revoke`,
    SEND_GUEST_EMAIL: (id: string) => `/certificates/${id}/send-guest-email`,
  },

  // Content (Articles)
  CONTENT: {
    ARTICLES: '/content/articles',
    ARTICLES_ALL: '/content/articles/all',
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

  // About Page Content
  ABOUT: {
    BASE: '/about',
    ADMIN: '/about/admin',
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

  // Newsletter
  NEWSLETTER: {
    SUBSCRIBE: '/newsletter/subscribe',
    SUBSCRIBERS: '/newsletter/subscribers',
    UPDATE_STATUS: (id: string) => `/newsletter/subscribers/${id}/status`,
  },

  // Contact
  CONTACT: {
    MESSAGES: '/contact/messages',
    BY_ID: (id: string) => `/contact/messages/${id}`,
    UPDATE_STATUS: (id: string) => `/contact/messages/${id}/status`,
    UPDATE_READ: (id: string) => `/contact/messages/${id}/read`,
    REPLY: (id: string) => `/contact/messages/${id}/reply`,
  },

  // Site Content
  SITE_CONTENT: {
    PUBLIC: '/site-content/public',
    ADMIN: '/site-content/admin',
    BASE: '/site-content',
    FOOTER: '/site-content/footer',
    HOMEPAGE: '/site-content/homepage',
    HOMEPAGE_COUNTDOWN_EVENT: '/site-content/homepage/countdown-event',
    LEGAL_PRIVACY: '/site-content/legal/privacy',
    LEGAL_TERMS: '/site-content/legal/terms',
    PUBLISH_PRIVACY: '/site-content/legal/privacy/publish',
    PUBLISH_TERMS: '/site-content/legal/terms/publish',
  },

  // Notifications
  NOTIFICATIONS: {
    BASE: '/notifications',
    MARK_READ: (id: string) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/read-all',
  },
} as const;
