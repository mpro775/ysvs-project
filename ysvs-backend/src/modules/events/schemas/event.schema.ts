import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';
import { ALL_DEFAULT_PROFILE_FIELD_IDS } from '../constants/default-profile-fields';

export type EventDocument = HydratedDocument<Event>;

export enum EventStatus {
  UPCOMING = 'upcoming',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum RegistrationAccess {
  AUTHENTICATED_ONLY = 'authenticated_only',
  PUBLIC = 'public',
}

export enum GuestEmailMode {
  REQUIRED = 'required',
  OPTIONAL = 'optional',
}

export enum SessionType {
  TALK = 'talk',
  PANEL = 'panel',
  WORKSHOP = 'workshop',
  BREAK = 'break',
  NETWORKING = 'networking',
  OPENING = 'opening',
  CLOSING = 'closing',
}

export enum EventMode {
  IN_PERSON = 'in_person',
  ONLINE = 'online',
}

export enum EventStreamProvider {
  YOUTUBE = 'youtube',
  VIMEO = 'vimeo',
  ZOOM = 'zoom',
  CUSTOM = 'custom',
}

export enum FormFieldType {
  SECTION = 'section',
  TEXT = 'text',
  TEXTAREA = 'textarea',
  SELECT = 'select',
  MULTISELECT = 'multiselect',
  CHECKBOX = 'checkbox',
  RADIO = 'radio',
  FILE = 'file',
  DATE = 'date',
  EMAIL = 'email',
  PHONE = 'phone',
  NUMBER = 'number',
}

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
}

export interface EventScheduleItem {
  id: string;
  dayId?: string;
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
  id?: string;
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

@Schema({ timestamps: true })
export class Event extends Document {
  @Prop({ required: true, trim: true })
  titleAr: string;

  @Prop({ required: true, trim: true })
  titleEn: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ trim: true })
  descriptionAr: string;

  @Prop({ trim: true })
  descriptionEn: string;

  @Prop()
  coverImage: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ type: Object })
  location: Location;

  @Prop({
    type: String,
    enum: Object.values(EventMode),
    default: EventMode.IN_PERSON,
  })
  eventMode: EventMode;

  @Prop({ default: false })
  hasLiveStream: boolean;

  @Prop({ type: Object })
  liveStream?: EventLiveStream;

  @Prop({
    type: String,
    enum: Object.values(EventStatus),
    default: EventStatus.UPCOMING,
  })
  status: EventStatus;

  @Prop({ default: false })
  registrationOpen: boolean;

  @Prop({
    type: String,
    enum: Object.values(RegistrationAccess),
    default: RegistrationAccess.AUTHENTICATED_ONLY,
  })
  registrationAccess: RegistrationAccess;

  @Prop({
    type: String,
    enum: Object.values(GuestEmailMode),
    default: GuestEmailMode.REQUIRED,
  })
  guestEmailMode: GuestEmailMode;

  @Prop()
  registrationDeadline: Date;

  @Prop({ default: 0 })
  maxAttendees: number;

  @Prop({ default: 0 })
  currentAttendees: number;

  @Prop({ type: [String], default: [] })
  outcomes: string[];

  @Prop({ type: [String], default: [] })
  objectives: string[];

  @Prop({ type: [String], default: [] })
  targetAudience: string[];

  @Prop({ type: [Object], default: [] })
  speakers: EventSpeaker[];

  @Prop({ type: [Object], default: [] })
  schedule: EventScheduleItem[];

  @Prop({ type: [Object], default: [] })
  eventDays: EventDay[];

  @Prop({ type: [Object], default: [] })
  formSchema: FormField[];

  @Prop({ default: true })
  includeDefaultProfileFields: boolean;

  @Prop({ type: [String], default: ALL_DEFAULT_PROFILE_FIELD_IDS })
  defaultProfileFieldIds: string[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'TicketType' }] })
  ticketTypes: Types.ObjectId[];

  @Prop({ default: 0 })
  cmeHours: number;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const EventSchema = SchemaFactory.createForClass(Event);

// Indexes
EventSchema.index({ slug: 1 }, { unique: true });
EventSchema.index({ status: 1, startDate: 1 });
EventSchema.index({ registrationOpen: 1, registrationDeadline: 1 });
