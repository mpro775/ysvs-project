import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export type ContactMessageDocument = HydratedDocument<ContactMessage>;

export enum ContactMessageStatus {
  NEW = 'new',
  IN_PROGRESS = 'in_progress',
  REPLIED = 'replied',
  ARCHIVED = 'archived',
  SPAM = 'spam',
}

@Schema({ _id: false })
export class ContactReply {
  @Prop({ required: true, trim: true })
  body: string;

  @Prop({ trim: true })
  subject?: string;

  @Prop({ required: true, trim: true })
  repliedBy: string;

  @Prop({ required: true })
  repliedAt: Date;

  @Prop({ required: true, default: false })
  sentSuccessfully: boolean;

  @Prop()
  error?: string;
}

export const ContactReplySchema = SchemaFactory.createForClass(ContactReply);

@Schema({ timestamps: true, collection: 'contact_messages' })
export class ContactMessage extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true, lowercase: true })
  email: string;

  @Prop({ required: true, trim: true })
  subject: string;

  @Prop({ required: true, trim: true })
  message: string;

  @Prop({
    type: String,
    enum: Object.values(ContactMessageStatus),
    default: ContactMessageStatus.NEW,
  })
  status: ContactMessageStatus;

  @Prop({ default: false })
  isRead: boolean;

  @Prop()
  readAt?: Date;

  @Prop({ trim: true })
  assignedTo?: string;

  @Prop({ trim: true })
  source?: string;

  @Prop({ trim: true })
  locale?: string;

  @Prop({ trim: true })
  ip?: string;

  @Prop({ trim: true })
  userAgent?: string;

  @Prop({ type: [ContactReplySchema], default: [] })
  replies: ContactReply[];

  @Prop()
  lastRepliedAt?: Date;

  @Prop({ trim: true })
  lastReplyBy?: string;

  @Prop()
  archivedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const ContactMessageSchema = SchemaFactory.createForClass(ContactMessage);

ContactMessageSchema.index({ status: 1, createdAt: -1 });
ContactMessageSchema.index({ isRead: 1, createdAt: -1 });
ContactMessageSchema.index({ email: 1, createdAt: -1 });
