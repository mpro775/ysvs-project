import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export type AboutContentDocument = HydratedDocument<AboutContent>;

@Schema({ _id: false })
export class AboutObjective {
  @Prop({ required: true, trim: true })
  textAr: string;

  @Prop({ required: true, trim: true })
  textEn: string;

  @Prop({ default: 0 })
  order: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const AboutObjectiveSchema = SchemaFactory.createForClass(AboutObjective);

@Schema({ timestamps: true })
export class AboutContent extends Document {
  @Prop({
    required: true,
    unique: true,
    default: 'about',
    immutable: true,
    trim: true,
    lowercase: true,
  })
  singletonKey: string;

  @Prop({ required: true, trim: true })
  heroTitleAr: string;

  @Prop({ required: true, trim: true })
  heroTitleEn: string;

  @Prop({ required: true, trim: true })
  heroDescriptionAr: string;

  @Prop({ required: true, trim: true })
  heroDescriptionEn: string;

  @Prop({ required: true, trim: true })
  visionTitleAr: string;

  @Prop({ required: true, trim: true })
  visionTitleEn: string;

  @Prop({ required: true, trim: true })
  visionTextAr: string;

  @Prop({ required: true, trim: true })
  visionTextEn: string;

  @Prop({ required: true, trim: true })
  missionTitleAr: string;

  @Prop({ required: true, trim: true })
  missionTitleEn: string;

  @Prop({ required: true, trim: true })
  missionTextAr: string;

  @Prop({ required: true, trim: true })
  missionTextEn: string;

  @Prop({ type: [AboutObjectiveSchema], default: [] })
  objectives: AboutObjective[];

  createdAt: Date;
  updatedAt: Date;
}

export const AboutContentSchema = SchemaFactory.createForClass(AboutContent);

// Indexes
AboutContentSchema.index({ singletonKey: 1 }, { unique: true });
