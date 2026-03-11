// User types
export const UserRole = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MEMBER: 'member',
  PUBLIC: 'public',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const ProfessionalVerificationStatus = {
  NOT_SUBMITTED: 'not_submitted',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type ProfessionalVerificationStatus =
  (typeof ProfessionalVerificationStatus)[keyof typeof ProfessionalVerificationStatus];

export const Gender = {
  MALE: 'male',
  FEMALE: 'female',
} as const;

export type Gender = (typeof Gender)[keyof typeof Gender];

export interface VerificationDocument {
  key: string;
  url: string;
  originalName: string;
  mimetype: string;
  size: number;
  uploadedAt: Date;
}

export interface ProfessionalVerification {
  status: ProfessionalVerificationStatus;
  document?: VerificationDocument;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  lastSubmittedAt?: Date;
}

export interface User {
  _id: string;
  email: string;
  fullNameAr: string;
  fullNameEn: string;
  phone?: string;
  role: UserRole;
  specialty?: string;
  workplace?: string;
  gender?: Gender;
  membershipDate?: Date;
  isActive: boolean;
  isVerified: boolean;
  avatar?: string;
  professionalVerification?: ProfessionalVerification;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Event types
export const EventStatus = {
  UPCOMING: 'upcoming',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type EventStatus = (typeof EventStatus)[keyof typeof EventStatus];

export const RegistrationAccess = {
  AUTHENTICATED_ONLY: 'authenticated_only',
  PUBLIC: 'public',
} as const;

export type RegistrationAccess =
  (typeof RegistrationAccess)[keyof typeof RegistrationAccess];

export const GuestEmailMode = {
  REQUIRED: 'required',
  OPTIONAL: 'optional',
} as const;

export type GuestEmailMode = (typeof GuestEmailMode)[keyof typeof GuestEmailMode];

export const SessionType = {
  TALK: 'talk',
  PANEL: 'panel',
  WORKSHOP: 'workshop',
  BREAK: 'break',
  NETWORKING: 'networking',
  OPENING: 'opening',
  CLOSING: 'closing',
} as const;

export type SessionType = (typeof SessionType)[keyof typeof SessionType];

export const EventMode = {
  IN_PERSON: 'in_person',
  ONLINE: 'online',
} as const;

export type EventMode = (typeof EventMode)[keyof typeof EventMode];

export const EventStreamProvider = {
  YOUTUBE: 'youtube',
  VIMEO: 'vimeo',
  ZOOM: 'zoom',
  CUSTOM: 'custom',
} as const;

export type EventStreamProvider = (typeof EventStreamProvider)[keyof typeof EventStreamProvider];

export const FormFieldType = {
  SECTION: 'section',
  TEXT: 'text',
  TEXTAREA: 'textarea',
  SELECT: 'select',
  MULTISELECT: 'multiselect',
  CHECKBOX: 'checkbox',
  RADIO: 'radio',
  FILE: 'file',
  DATE: 'date',
  EMAIL: 'email',
  PHONE: 'phone',
  NUMBER: 'number',
} as const;

export type FormFieldType = (typeof FormFieldType)[keyof typeof FormFieldType];

export interface FormFieldOption {
  value: string;
  label: string;
  labelEn?: string;
}

export interface FormFieldValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  fileTypes?: string[];
  maxFileSize?: number;
}

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  labelEn: string;
  placeholder?: string;
  placeholderEn?: string;
  required: boolean;
  options?: FormFieldOption[];
  allowOther?: boolean;
  validation?: FormFieldValidation;
  order: number;
}

export interface UploadedFormFile {
  key: string;
  url: string;
  originalName: string;
  size: number;
  mimetype: string;
}

export interface Location {
  venue: string;
  venueEn?: string;
  address: string;
  addressEn?: string;
  city: string;
  cityEn?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface EventSpeaker {
  id: string;
  nameAr: string;
  nameEn?: string;
  titleAr: string;
  titleEn?: string;
  organizationAr?: string;
  organizationEn?: string;
  bioAr?: string;
  bioEn?: string;
  imageMediaId?: string;
  imageUrl?: string;
  image?: string;
}

export interface EventScheduleItem {
  id: string;
  titleAr: string;
  titleEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  startTime: Date;
  endTime: Date;
  sessionType: SessionType;
  speakerIds?: string[];
}

export interface EventDay {
  date: Date;
  startTime: Date;
  endTime: Date;
  cmeHours: number;
}

export interface EventLiveStream {
  provider: EventStreamProvider;
  embedUrl?: string;
  joinUrl?: string;
  meetingId?: string;
  passcode?: string;
  instructions?: string;
  supportContact?: string;
  joinWindowMinutes?: number;
  recordingAvailable?: boolean;
  recordingUrl?: string;
}

export interface Event {
  _id: string;
  titleAr: string;
  titleEn: string;
  slug: string;
  descriptionAr?: string;
  descriptionEn?: string;
  coverImage?: string;
  startDate: Date;
  endDate: Date;
  location?: Location;
  eventMode?: EventMode;
  hasLiveStream?: boolean;
  liveStream?: EventLiveStream;
  status: EventStatus;
  registrationOpen: boolean;
  registrationAccess?: RegistrationAccess;
  guestEmailMode?: GuestEmailMode;
  registrationDeadline?: Date;
  maxAttendees: number;
  currentAttendees: number;
  outcomes?: string[];
  objectives?: string[];
  targetAudience?: string[];
  speakers?: EventSpeaker[];
  schedule?: EventScheduleItem[];
  eventDays?: EventDay[];
  formSchema: FormField[];
  ticketTypes?: string[];
  cmeHours: number;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Certificate types
export interface Certificate {
  _id: string;
  registration: string;
  event: string;
  user?: string;
  holderType?: 'user' | 'guest';
  holderEmail?: string;
  serialNumber: string;
  qrCode: string;
  recipientNameAr: string;
  recipientNameEn: string;
  eventTitleAr: string;
  eventTitleEn: string;
  cmeHours: number;
  issueDate: Date;
  eventDate?: Date;
  templateUsed?: string;
  pdfPath?: string;
  pdfUrl?: string;
  guestEmailSentAt?: Date;
  guestEmailLastError?: string;
  guestDownloadTokenIssuedAt?: Date;
  isValid: boolean;
  revokedAt?: Date;
  revokedReason?: string;
  revokedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Registration types
export interface Registration {
  _id: string;
  event: string | Event;
  user?: string | User;
  registrationSource?: 'user' | 'guest';
  guestEmail?: string;
  registrationNumber: string;
  formData: Record<string, unknown>;
  ticketType?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'attended';
  paymentStatus?: 'pending' | 'paid' | 'refunded';
  attendedAt?: Date;
  certificateIssued?: boolean;
  certificate?: string | Certificate;
  createdAt: Date;
  updatedAt: Date;
}

// Article types
export interface Article {
  _id: string;
  titleAr: string;
  titleEn: string;
  slug: string;
  excerptAr?: string;
  excerptEn?: string;
  summaryAr?: string;
  summaryEn?: string;
  contentAr: string;
  contentEn: string;
  coverImage?: string;
  category?: string;
  tags?: string[];
  status: 'draft' | 'published';
  isFeatured?: boolean;
  publishedAt?: Date;
  author?: string | User;
  createdAt: Date;
  updatedAt: Date;
}

// Board member types
export interface BoardMember {
  _id: string;
  nameAr: string;
  nameEn: string;
  positionAr: string;
  positionEn: string;
  bioAr?: string;
  bioEn?: string;
  image?: string;
  email?: string;
  phone?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AboutObjective {
  textAr: string;
  textEn: string;
  order: number;
  isActive: boolean;
}

export interface AboutContent {
  _id: string;
  singletonKey: string;
  heroTitleAr: string;
  heroTitleEn: string;
  heroDescriptionAr: string;
  heroDescriptionEn: string;
  visionTitleAr: string;
  visionTitleEn: string;
  visionTextAr: string;
  visionTextEn: string;
  missionTitleAr: string;
  missionTitleEn: string;
  missionTextAr: string;
  missionTextEn: string;
  objectives: AboutObjective[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FooterQuickLink {
  labelAr: string;
  labelEn: string;
  href: string;
  order: number;
  isActive: boolean;
}

export interface FooterSocialLink {
  platform: string;
  url: string;
  order: number;
  isActive: boolean;
}

export interface FooterContent {
  descriptionAr: string;
  descriptionEn: string;
  addressAr: string;
  addressEn: string;
  phone: string;
  email: string;
  quickLinks: FooterQuickLink[];
  socialLinks: FooterSocialLink[];
  copyrightAr: string;
  copyrightEn: string;
}

export interface LegalPage {
  titleAr: string;
  titleEn: string;
  contentAr: string;
  contentEn: string;
  version: number;
  effectiveDate?: Date;
  publishedAt?: Date;
  isPublished: boolean;
}

export interface LegalPageMetadata {
  titleAr: string;
  titleEn: string;
  version: number;
  effectiveDate?: Date;
  slug: 'privacy' | 'terms';
}

export interface HomepageContent {
  countdownEventId?: string | null;
  conferencesCount?: number;
  registeredMembersCount?: number;
  annualActivitiesCount?: number;
}

export interface HomepageCountdownEvent {
  _id: string;
  titleAr: string;
  titleEn: string;
  slug: string;
  startDate: Date;
  endDate: Date;
  location?: Location;
  coverImage?: string;
}

export interface SitePublicContent {
  footer: FooterContent;
  homepage: HomepageContent;
  legal: LegalPageMetadata[];
}

export interface SiteContent {
  _id: string;
  singletonKey: string;
  footer: FooterContent;
  homepage: HomepageContent;
  legalPages: {
    privacy: LegalPage;
    terms: LegalPage;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Streaming types
export interface StreamStatus {
  isLive: boolean;
  embedUrl?: string;
  title?: string;
  titleEn?: string;
  eventId?: string;
  startedAt?: Date;
  viewerCount?: number;
}

export interface StreamConfig {
  _id: string;
  embedUrl: string;
  title: string;
  titleEn?: string;
  event?: string;
  isActive: boolean;
  startedAt?: Date;
  endedAt?: Date;
  startedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullNameAr: string;
  fullNameEn: string;
  phone?: string;
  specialty?: string;
  workplace?: string;
  gender: Gender;
}

export interface ProfessionalVerificationReviewData {
  decision: 'approved' | 'rejected';
  rejectionReason?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  guestLinkResult?: {
    registrationsLinked: number;
    certificatesLinked: number;
    skippedRegistrationConflicts: number;
  };
}

// Dashboard stats
export interface DashboardStats {
  eventsCount: number;
  eventsChange: number;
  membersCount: number;
  membersChange: number;
  certificatesCount: number;
  certificatesChange: number;
  articlesCount: number;
  articlesChange: number;
  newsletterSubscribersCount: number;
  newsletterSubscribersChange: number;
  contactMessagesCount: number;
  contactMessagesChange: number;
  unreadContactMessagesCount: number;
  upcomingEvents: Event[];
  recentActivities: Activity[];
}

export interface Activity {
  id: string;
  type:
    | 'registration'
    | 'article'
    | 'certificate'
    | 'member'
    | 'newsletter'
    | 'contact';
  message: string;
  timestamp: Date;
}

export type NotificationSeverity = 'info' | 'success' | 'warning' | 'critical';

export interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  entityId?: string;
  entityType?: string;
  severity: NotificationSeverity;
  createdAt: Date | string;
  actionUrl?: string;
  meta?: Record<string, unknown>;
  isRead: boolean;
  readAt?: Date | string;
}

export interface NewsletterSubscriber {
  _id: string;
  email: string;
  status: 'pending' | 'subscribed' | 'unsubscribed';
  source?: string;
  locale?: string;
  subscribedAt?: Date;
  confirmedAt?: Date;
  unsubscribedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type ContactMessageStatus =
  | 'new'
  | 'in_progress'
  | 'replied'
  | 'archived'
  | 'spam';

export interface ContactReply {
  body: string;
  subject?: string;
  repliedBy: string;
  repliedAt: Date;
  sentSuccessfully: boolean;
  error?: string;
}

export interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  isRead: boolean;
  readAt?: Date;
  assignedTo?: string;
  source?: string;
  locale?: string;
  ip?: string;
  userAgent?: string;
  replies: ContactReply[];
  lastRepliedAt?: Date;
  lastReplyBy?: string;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
