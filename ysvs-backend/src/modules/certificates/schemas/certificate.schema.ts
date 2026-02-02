import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';

export type CertificateDocument = HydratedDocument<Certificate>;

@Schema({ timestamps: true })
export class Certificate extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Registration', required: true })
  registration: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Event', required: true })
  event: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

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
