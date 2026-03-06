import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

type StoredNotificationSeverity = 'info' | 'success' | 'warning' | 'critical';

@Schema({ _id: false })
export class NotificationReadEntry {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Date, required: true })
  readAt: Date;
}

const NotificationReadEntrySchema = SchemaFactory.createForClass(NotificationReadEntry);

@Schema({ timestamps: true, collection: 'admin_notifications' })
export class AdminNotification {
  @Prop({ required: true, trim: true, maxlength: 120 })
  type: string;

  @Prop({ required: true, trim: true, maxlength: 180 })
  title: string;

  @Prop({ required: true, trim: true, maxlength: 600 })
  message: string;

  @Prop({ trim: true, maxlength: 120 })
  entityId?: string;

  @Prop({ trim: true, maxlength: 80 })
  entityType?: string;

  @Prop({ required: true, enum: ['info', 'success', 'warning', 'critical'] })
  severity: StoredNotificationSeverity;

  @Prop({ trim: true, maxlength: 300 })
  actionUrl?: string;

  @Prop({ type: Object })
  meta?: Record<string, unknown>;

  @Prop({ type: [NotificationReadEntrySchema], default: [] })
  readBy: NotificationReadEntry[];

  createdAt: Date;
  updatedAt: Date;
}

export type AdminNotificationDocument = HydratedDocument<AdminNotification>;

export const AdminNotificationSchema = SchemaFactory.createForClass(AdminNotification);

AdminNotificationSchema.index({ createdAt: -1 });
AdminNotificationSchema.index({ type: 1, createdAt: -1 });
AdminNotificationSchema.index({ 'readBy.user': 1, createdAt: -1 });
