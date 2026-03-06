import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { NotificationsQueryDto } from './dto/notifications-query.dto';
import {
  AdminNotification,
  AdminNotificationDocument,
} from './schemas/admin-notification.schema';
import { NotificationEvent } from './interfaces/notification-event.interface';

export interface AdminNotificationView extends NotificationEvent {
  isRead: boolean;
  readAt?: Date;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(AdminNotification.name)
    private readonly adminNotificationModel: Model<AdminNotificationDocument>,
  ) {}

  async listForAdmin(
    adminUserId: string,
    queryDto: NotificationsQueryDto,
  ): Promise<PaginatedResult<AdminNotificationView>> {
    const userObjectId = this.toObjectId(adminUserId);
    const page = queryDto.page || 1;
    const limit = queryDto.limit || 20;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};
    if (queryDto.unreadOnly) {
      query['readBy.user'] = { $ne: userObjectId };
    }

    const [notifications, total] = await Promise.all([
      this.adminNotificationModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.adminNotificationModel.countDocuments(query),
    ]);

    const mapped = notifications.map((notification) =>
      this.mapDocumentToView(notification, userObjectId),
    );

    return new PaginatedResult(mapped, total, page, limit);
  }

  async markAsRead(
    notificationId: string,
    adminUserId: string,
  ): Promise<AdminNotificationView> {
    const objectNotificationId = this.toObjectId(notificationId, 'معرف الإشعار غير صالح');
    const userObjectId = this.toObjectId(adminUserId);
    const now = new Date();

    await this.adminNotificationModel.updateOne(
      {
        _id: objectNotificationId,
        'readBy.user': { $ne: userObjectId },
      },
      {
        $push: {
          readBy: {
            user: userObjectId,
            readAt: now,
          },
        },
      },
    );

    const notification = await this.adminNotificationModel
      .findById(objectNotificationId)
      .lean()
      .exec();

    if (!notification) {
      throw new NotFoundException('الإشعار غير موجود');
    }

    return this.mapDocumentToView(notification, userObjectId);
  }

  async markAllAsRead(adminUserId: string): Promise<{ updated: number }> {
    const userObjectId = this.toObjectId(adminUserId);
    const now = new Date();

    const unreadIds = await this.adminNotificationModel
      .find({ 'readBy.user': { $ne: userObjectId } })
      .select('_id')
      .lean()
      .exec();

    if (unreadIds.length === 0) {
      return { updated: 0 };
    }

    const result = await this.adminNotificationModel.bulkWrite(
      unreadIds.map((notification) => ({
        updateOne: {
          filter: {
            _id: notification._id,
            'readBy.user': { $ne: userObjectId },
          },
          update: {
            $push: {
              readBy: {
                user: userObjectId,
                readAt: now,
              },
            },
          },
        },
      })),
    );

    return { updated: result.modifiedCount || 0 };
  }

  private mapDocumentToView(
    notification: Pick<
      AdminNotification,
      'type' | 'title' | 'message' | 'entityId' | 'entityType' | 'severity' | 'actionUrl' | 'meta'
    > & {
      _id?: Types.ObjectId;
      createdAt: Date;
      readBy?: Array<{ user: Types.ObjectId; readAt: Date }>;
    },
    userId: Types.ObjectId,
  ): AdminNotificationView {
    const readEntry = (notification.readBy || []).find(
      (entry) => entry.user.toString() === userId.toString(),
    );

    return {
      id: notification._id?.toString() || '',
      type: notification.type,
      title: notification.title,
      message: notification.message,
      entityId: notification.entityId,
      entityType: notification.entityType,
      severity: notification.severity,
      createdAt: notification.createdAt,
      actionUrl: notification.actionUrl,
      meta: notification.meta,
      isRead: Boolean(readEntry),
      readAt: readEntry?.readAt,
    };
  }

  private toObjectId(value: string, errorMessage: string = 'معرف المستخدم غير صالح'): Types.ObjectId {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException(errorMessage);
    }

    return new Types.ObjectId(value);
  }
}
