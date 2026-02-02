import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';

export type StreamConfigDocument = HydratedDocument<StreamConfig>;

export enum StreamProvider {
  YOUTUBE = 'youtube',
  VIMEO = 'vimeo',
  ZOOM = 'zoom',
  CUSTOM = 'custom',
}

@Schema({ timestamps: true })
export class StreamConfig extends Document {
  @Prop({ default: false })
  isLive: boolean;

  @Prop({
    type: String,
    enum: Object.values(StreamProvider),
    default: StreamProvider.YOUTUBE,
  })
  provider: StreamProvider;

  @Prop()
  embedUrl: string;

  @Prop()
  titleAr: string;

  @Prop()
  titleEn: string;

  @Prop()
  descriptionAr: string;

  @Prop()
  descriptionEn: string;

  @Prop({ type: Types.ObjectId, ref: 'Event' })
  event: Types.ObjectId;

  @Prop()
  startedAt: Date;

  @Prop()
  endedAt: Date;

  @Prop({ default: 0 })
  viewerCount: number;

  @Prop({ default: false })
  notificationSent: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  startedBy: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const StreamConfigSchema = SchemaFactory.createForClass(StreamConfig);

// Indexes
StreamConfigSchema.index({ isLive: 1 });
StreamConfigSchema.index({ event: 1 });
