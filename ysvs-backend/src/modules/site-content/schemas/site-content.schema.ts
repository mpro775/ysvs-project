import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export type SiteContentDocument = HydratedDocument<SiteContent>;

@Schema({ _id: false })
export class FooterQuickLink {
  @Prop({ required: true, trim: true, maxlength: 120 })
  labelAr: string;

  @Prop({ required: true, trim: true, maxlength: 120 })
  labelEn: string;

  @Prop({ required: true, trim: true, maxlength: 400 })
  href: string;

  @Prop({ default: 0 })
  order: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const FooterQuickLinkSchema = SchemaFactory.createForClass(FooterQuickLink);

@Schema({ _id: false })
export class FooterSocialLink {
  @Prop({ required: true, trim: true, maxlength: 60 })
  platform: string;

  @Prop({ required: true, trim: true, maxlength: 400 })
  url: string;

  @Prop({ default: 0 })
  order: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const FooterSocialLinkSchema = SchemaFactory.createForClass(FooterSocialLink);

@Schema({ _id: false })
export class FooterContent {
  @Prop({ required: true, trim: true, maxlength: 1000 })
  descriptionAr: string;

  @Prop({ required: true, trim: true, maxlength: 1000 })
  descriptionEn: string;

  @Prop({ required: true, trim: true, maxlength: 300 })
  addressAr: string;

  @Prop({ required: true, trim: true, maxlength: 300 })
  addressEn: string;

  @Prop({ required: true, trim: true, maxlength: 50 })
  phone: string;

  @Prop({ required: true, trim: true, lowercase: true, maxlength: 255 })
  email: string;

  @Prop({ type: [FooterQuickLinkSchema], default: [] })
  quickLinks: FooterQuickLink[];

  @Prop({ type: [FooterSocialLinkSchema], default: [] })
  socialLinks: FooterSocialLink[];

  @Prop({ required: true, trim: true, maxlength: 300 })
  copyrightAr: string;

  @Prop({ required: true, trim: true, maxlength: 300 })
  copyrightEn: string;
}

export const FooterContentSchema = SchemaFactory.createForClass(FooterContent);

@Schema({ _id: false })
export class LegalPage {
  @Prop({ required: true, trim: true, maxlength: 200 })
  titleAr: string;

  @Prop({ required: true, trim: true, maxlength: 200 })
  titleEn: string;

  @Prop({ required: true, trim: true, maxlength: 50000 })
  contentAr: string;

  @Prop({ required: true, trim: true, maxlength: 50000 })
  contentEn: string;

  @Prop({ default: 1, min: 1 })
  version: number;

  @Prop({ required: false })
  effectiveDate?: Date;

  @Prop({ required: false })
  publishedAt?: Date;

  @Prop({ default: false })
  isPublished: boolean;
}

export const LegalPageSchema = SchemaFactory.createForClass(LegalPage);

@Schema({ _id: false })
export class LegalPages {
  @Prop({ type: LegalPageSchema, required: true })
  privacy: LegalPage;

  @Prop({ type: LegalPageSchema, required: true })
  terms: LegalPage;
}

export const LegalPagesSchema = SchemaFactory.createForClass(LegalPages);

@Schema({ timestamps: true })
export class SiteContent extends Document {
  @Prop({
    required: true,
    unique: true,
    default: 'site-content',
    immutable: true,
    trim: true,
    lowercase: true,
  })
  singletonKey: string;

  @Prop({ type: FooterContentSchema, required: true })
  footer: FooterContent;

  @Prop({ type: LegalPagesSchema, required: true })
  legalPages: LegalPages;

  createdAt: Date;
  updatedAt: Date;
}

export const SiteContentSchema = SchemaFactory.createForClass(SiteContent);

SiteContentSchema.index({ singletonKey: 1 }, { unique: true });
