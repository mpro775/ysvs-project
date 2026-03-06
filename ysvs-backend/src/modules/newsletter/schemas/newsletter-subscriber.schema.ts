import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export type NewsletterSubscriberDocument = HydratedDocument<NewsletterSubscriber>;

export enum NewsletterSubscriberStatus {
  PENDING = 'pending',
  SUBSCRIBED = 'subscribed',
  UNSUBSCRIBED = 'unsubscribed',
}

@Schema({ timestamps: true, collection: 'newsletter_subscribers' })
export class NewsletterSubscriber extends Document {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({
    type: String,
    enum: Object.values(NewsletterSubscriberStatus),
    default: NewsletterSubscriberStatus.PENDING,
  })
  status: NewsletterSubscriberStatus;

  @Prop()
  source?: string;

  @Prop()
  locale?: string;

  @Prop()
  subscribedAt?: Date;

  @Prop()
  confirmedAt?: Date;

  @Prop()
  unsubscribedAt?: Date;

  @Prop()
  lastSubscriptionIp?: string;

  @Prop()
  lastSubscriptionUserAgent?: string;

  @Prop()
  confirmTokenHash?: string;

  @Prop()
  confirmTokenExpiresAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const NewsletterSubscriberSchema = SchemaFactory.createForClass(
  NewsletterSubscriber,
);

NewsletterSubscriberSchema.index({ email: 1 }, { unique: true });
NewsletterSubscriberSchema.index({ status: 1, createdAt: -1 });
