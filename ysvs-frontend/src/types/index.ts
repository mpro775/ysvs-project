// User types
export const UserRole = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MEMBER: 'member',
  PUBLIC: 'public',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export interface User {
  _id: string;
  email: string;
  fullNameAr: string;
  fullNameEn: string;
  phone?: string;
  role: UserRole;
  specialty?: string;
  workplace?: string;
  membershipDate?: Date;
  isActive: boolean;
  isVerified: boolean;
  avatar?: string;
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

export const FormFieldType = {
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
  validation?: FormFieldValidation;
  order: number;
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
  status: EventStatus;
  registrationOpen: boolean;
  registrationDeadline?: Date;
  maxAttendees: number;
  currentAttendees: number;
  formSchema: FormField[];
  ticketTypes?: string[];
  cmeHours: number;
  isLive: boolean;
  streamUrl?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Certificate types
export interface Certificate {
  _id: string;
  registration: string;
  event: string;
  user: string;
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
  user: string | User;
  registrationNumber: string;
  formData: Record<string, unknown>;
  ticketType?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'attended';
  paymentStatus?: 'pending' | 'paid' | 'refunded';
  attendedAt?: Date;
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
  summaryAr?: string;
  summaryEn?: string;
  contentAr: string;
  contentEn: string;
  coverImage?: string;
  category?: string;
  tags?: string[];
  status: 'draft' | 'published';
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
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
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
  upcomingEvents: Event[];
  recentActivities: Activity[];
}

export interface Activity {
  id: string;
  type: 'registration' | 'article' | 'certificate' | 'member';
  message: string;
  timestamp: Date;
}
