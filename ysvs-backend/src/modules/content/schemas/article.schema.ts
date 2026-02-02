import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';

export type ArticleDocument = HydratedDocument<Article>;

export enum ArticleStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
}

@Schema({ timestamps: true })
export class Article extends Document {
  @Prop({ required: true, trim: true })
  titleAr: string;

  @Prop({ required: true, trim: true })
  titleEn: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ trim: true })
  excerptAr: string;

  @Prop({ trim: true })
  excerptEn: string;

  @Prop({ required: true })
  contentAr: string;

  @Prop({ required: true })
  contentEn: string;

  @Prop()
  coverImage: string;

  @Prop({ type: Types.ObjectId, ref: 'Category' })
  category: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  author: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(ArticleStatus),
    default: ArticleStatus.DRAFT,
  })
  status: ArticleStatus;

  @Prop()
  publishedAt: Date;

  @Prop({ default: 0 })
  viewCount: number;

  @Prop({ default: false })
  isFeatured: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const ArticleSchema = SchemaFactory.createForClass(Article);

// Indexes
ArticleSchema.index({ slug: 1 }, { unique: true });
ArticleSchema.index({ status: 1, publishedAt: -1 });
ArticleSchema.index({ category: 1 });
ArticleSchema.index({ author: 1 });
ArticleSchema.index({ isFeatured: 1, publishedAt: -1 });
ArticleSchema.index({ titleAr: 'text', titleEn: 'text', contentAr: 'text', contentEn: 'text' });
