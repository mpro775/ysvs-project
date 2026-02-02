import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';

export type EventDocument = HydratedDocument<Event>;

export enum EventStatus {
  UPCOMING = 'upcoming',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum FormFieldType {
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
    enum: Object.values(EventStatus),
    default: EventStatus.UPCOMING,
  })
  status: EventStatus;

  @Prop({ default: false })
  registrationOpen: boolean;

  @Prop()
  registrationDeadline: Date;

  @Prop({ default: 0 })
  maxAttendees: number;

  @Prop({ default: 0 })
  currentAttendees: number;

  @Prop({ type: [Object], default: [] })
  formSchema: FormField[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'TicketType' }] })
  ticketTypes: Types.ObjectId[];

  @Prop({ default: 0 })
  cmeHours: number;

  @Prop({ default: false })
  isLive: boolean;

  @Prop()
  streamUrl: string;

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
