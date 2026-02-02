import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';

export type RegistrationDocument = HydratedDocument<Registration>;

export enum RegistrationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  ATTENDED = 'attended',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  REFUNDED = 'refunded',
  FREE = 'free',
}

@Schema({ timestamps: true })
export class Registration extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Event', required: true })
  event: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'TicketType' })
  ticketType: Types.ObjectId;

  @Prop({ type: Map, of: Object, default: {} })
  formData: Map<string, unknown>;

  @Prop({
    type: String,
    enum: Object.values(RegistrationStatus),
    default: RegistrationStatus.PENDING,
  })
  status: RegistrationStatus;

  @Prop({
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;

  @Prop({ required: true, unique: true })
  registrationNumber: string;

  @Prop()
  qrCode: string;

  @Prop()
  attendedAt: Date;

  @Prop({ default: false })
  certificateIssued: boolean;

  @Prop()
  notes: string;

  createdAt: Date;
  updatedAt: Date;
}

export const RegistrationSchema = SchemaFactory.createForClass(Registration);

// Indexes
RegistrationSchema.index({ event: 1, user: 1 }, { unique: true });
RegistrationSchema.index({ registrationNumber: 1 }, { unique: true });
RegistrationSchema.index({ event: 1, status: 1 });
RegistrationSchema.index({ user: 1 });
