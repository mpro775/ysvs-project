import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';

export type CertificateDocument = HydratedDocument<Certificate>;

export enum CertificateHolderType {
  USER = 'user',
  GUEST = 'guest',
}

@Schema({ timestamps: true })
export class Certificate extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Registration', required: true })
  registration: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Event', required: true })
  event: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  user?: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(CertificateHolderType),
    default: CertificateHolderType.USER,
  })
  holderType: CertificateHolderType;

  @Prop({ trim: true, lowercase: true })
  holderEmail?: string;

  @Prop({ required: true, unique: true })
  serialNumber: string;

  @Prop({ required: true })
  qrCode: string;

  @Prop({ required: true })
  recipientNameAr: string;

  @Prop({ required: true })
  recipientNameEn: string;

  @Prop({ required: true })
  eventTitleAr: string;

  @Prop({ required: true })
  eventTitleEn: string;

  @Prop({ default: 0 })
  cmeHours: number;

  @Prop({ required: true })
  issueDate: Date;

  @Prop()
  eventDate: Date;

  @Prop()
  templateUsed: string;

  @Prop()
  pdfPath: string;

  @Prop()
  guestEmailSentAt?: Date;

  @Prop()
  guestEmailLastError?: string;

  @Prop()
  guestDownloadTokenIssuedAt?: Date;

  @Prop({ default: true })
  isValid: boolean;

  @Prop()
  revokedAt: Date;

  @Prop()
  revokedReason: string;

  @Prop()
  revokedBy: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const CertificateSchema = SchemaFactory.createForClass(Certificate);

// Indexes
CertificateSchema.index({ serialNumber: 1 }, { unique: true });
CertificateSchema.index({ user: 1 });
CertificateSchema.index({ event: 1 });
CertificateSchema.index({ registration: 1 }, { unique: true });
CertificateSchema.index({ isValid: 1 });
CertificateSchema.index({ holderType: 1, holderEmail: 1 });
