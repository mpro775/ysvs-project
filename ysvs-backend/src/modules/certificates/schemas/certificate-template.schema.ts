import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export type CertificateTemplateDocument = HydratedDocument<CertificateTemplate>;

export interface PositionConfig {
  x: number;
  y: number;
  fontSize?: number;
  fontColor?: string;
  align?: 'left' | 'center' | 'right';
}

export interface TemplateLayout {
  namePosition: PositionConfig;
  eventPosition: PositionConfig;
  datePosition: PositionConfig;
  qrPosition: PositionConfig;
  serialPosition: PositionConfig;
  cmeHoursPosition?: PositionConfig;
}

export interface TemplateFonts {
  nameFont?: string;
  nameFontSize?: number;
  eventFont?: string;
  eventFontSize?: number;
  defaultFont?: string;
  defaultFontSize?: number;
}

@Schema({ timestamps: true })
export class CertificateTemplate extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description: string;

  @Prop({ required: true })
  backgroundImage: string;

  @Prop({ type: Object, required: true })
  layout: TemplateLayout;

  @Prop({ type: Object })
  fonts: TemplateFonts;

  @Prop({ default: 'A4' })
  pageSize: string;

  @Prop({ default: 'landscape' })
  orientation: 'portrait' | 'landscape';

  @Prop({ default: false })
  isDefault: boolean;

  @Prop({ default: true })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const CertificateTemplateSchema =
  SchemaFactory.createForClass(CertificateTemplate);

// Indexes
CertificateTemplateSchema.index({ isDefault: 1 });
CertificateTemplateSchema.index({ isActive: 1 });
