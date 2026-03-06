import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import { Model } from 'mongoose';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationEvent } from './interfaces/notification-event.interface';
import {
  AdminNotification,
  AdminNotificationDocument,
} from './schemas/admin-notification.schema';

export type PublishNotificationInput = Omit<NotificationEvent, 'id' | 'createdAt'> & {
  id?: string;
  createdAt?: Date;
};

@Injectable()
export class NotificationsPublisherService {
  private readonly logger = new Logger(NotificationsPublisherService.name);

  constructor(
    private readonly notificationsGateway: NotificationsGateway,
    @InjectModel(AdminNotification.name)
    private readonly adminNotificationModel: Model<AdminNotificationDocument>,
  ) {}

  async publishToAdmins(input: PublishNotificationInput): Promise<NotificationEvent> {
    const event: NotificationEvent = {
      id: input.id || randomUUID(),
      createdAt: input.createdAt || new Date(),
      ...input,
    };

    try {
      const created = await this.adminNotificationModel.create({
        type: event.type,
        title: event.title,
        message: event.message,
        entityId: event.entityId,
        entityType: event.entityType,
        severity: event.severity,
        actionUrl: event.actionUrl,
        meta: event.meta,
      });

      event.id = created._id.toString();
      event.createdAt = created.createdAt;
    } catch (error) {
      this.logger.error(
        `Failed to persist notification event (${event.type}): ${(error as Error).message}`,
      );
    }

    try {
      this.notificationsGateway.emitToAdmins(event);
    } catch (error) {
      this.logger.error(
        `Failed to emit notification event (${event.type}): ${(error as Error).message}`,
      );
    }

    return event;
  }
}
