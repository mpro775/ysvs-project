import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationEvent } from './interfaces/notification-event.interface';

export type PublishNotificationInput = Omit<NotificationEvent, 'id' | 'createdAt'> & {
  id?: string;
  createdAt?: Date;
};

@Injectable()
export class NotificationsPublisherService {
  private readonly logger = new Logger(NotificationsPublisherService.name);

  constructor(private readonly notificationsGateway: NotificationsGateway) {}

  publishToAdmins(input: PublishNotificationInput): NotificationEvent {
    const event: NotificationEvent = {
      id: input.id || randomUUID(),
      createdAt: input.createdAt || new Date(),
      ...input,
    };

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
