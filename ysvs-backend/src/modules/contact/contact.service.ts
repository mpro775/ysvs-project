import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import {
  ContactMessage,
  ContactMessageDocument,
  ContactMessageStatus,
} from './schemas/contact-message.schema';
import {
  ContactQueryDto,
  CreateContactMessageDto,
  ReplyContactMessageDto,
  UpdateContactReadDto,
  UpdateContactStatusDto,
} from './dto';
import { ContactMailService } from './services/contact-mail.service';
import { NotificationsPublisherService } from '../notifications/notifications.publisher.service';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    @InjectModel(ContactMessage.name)
    private readonly contactMessageModel: Model<ContactMessageDocument>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
    private readonly contactMailService: ContactMailService,
    private readonly notificationsPublisherService: NotificationsPublisherService,
  ) {}

  async createMessage(
    dto: CreateContactMessageDto,
    ip: string,
    userAgent: string,
  ): Promise<{ message: string; id: string }> {
    await this.enforceRateLimit(
      `submit:${ip}`,
      this.configService.get<number>('contact.submitRateLimitPerMinute') || 5,
    );

    if (dto.website?.trim()) {
      throw new BadRequestException('طلب غير صالح');
    }

    const message = await this.contactMessageModel.create({
      name: dto.name.trim(),
      email: dto.email.trim().toLowerCase(),
      subject: dto.subject.trim(),
      message: dto.message.trim(),
      source: dto.source?.trim() || 'contact-page',
      locale: dto.locale?.trim(),
      ip,
      userAgent,
      status: ContactMessageStatus.NEW,
      isRead: false,
    });

    this.notificationsPublisherService.publishToAdmins({
      type: 'contact.new_message',
      title: 'رسالة تواصل جديدة',
      message: `رسالة جديدة من ${message.name}: ${message.subject}`,
      entityId: message._id.toString(),
      entityType: 'contact_message',
      severity: 'critical',
      actionUrl: '/admin/contact',
      meta: {
        email: message.email,
        source: message.source,
      },
    });

    await this.notifySupport(message);
    await this.sendAutoAckIfEnabled(message);

    return {
      id: message._id.toString(),
      message: 'تم استلام رسالتك بنجاح. سنقوم بالرد عليك قريباً.',
    };
  }

  async findAll(queryDto: ContactQueryDto): Promise<PaginatedResult<ContactMessage>> {
    const { page = 1, limit = 10, status, isRead, search } = queryDto;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};

    if (status) {
      query.status = status;
    }

    if (typeof isRead === 'boolean') {
      query.isRead = isRead;
    }

    if (search?.trim()) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { subject: searchRegex },
        { message: searchRegex },
      ];
    }

    const [messages, total] = await Promise.all([
      this.contactMessageModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.contactMessageModel.countDocuments(query),
    ]);

    return new PaginatedResult(messages, total, page, limit);
  }

  async findOne(id: string): Promise<ContactMessage> {
    const message = await this.contactMessageModel.findById(id).exec();

    if (!message) {
      throw new NotFoundException('رسالة التواصل غير موجودة');
    }

    if (!message.isRead) {
      message.isRead = true;
      message.readAt = new Date();
      await message.save();
    }

    return message;
  }

  async updateStatus(id: string, dto: UpdateContactStatusDto): Promise<ContactMessage> {
    const message = await this.contactMessageModel.findById(id).exec();

    if (!message) {
      throw new NotFoundException('رسالة التواصل غير موجودة');
    }

    message.status = dto.status;

    if (dto.assignedTo !== undefined) {
      const assignedTo = dto.assignedTo.trim();
      message.assignedTo = assignedTo || undefined;
    }

    if (dto.status === ContactMessageStatus.ARCHIVED) {
      message.archivedAt = new Date();
    } else {
      message.archivedAt = undefined;
    }

    await message.save();
    return message;
  }

  async updateReadStatus(id: string, dto: UpdateContactReadDto): Promise<ContactMessage> {
    const message = await this.contactMessageModel.findById(id).exec();

    if (!message) {
      throw new NotFoundException('رسالة التواصل غير موجودة');
    }

    message.isRead = dto.isRead;
    message.readAt = dto.isRead ? new Date() : undefined;

    await message.save();
    return message;
  }

  async reply(
    id: string,
    dto: ReplyContactMessageDto,
    repliedBy: string,
  ): Promise<{ sent: boolean; message: ContactMessage }> {
    const contactMessage = await this.contactMessageModel.findById(id).exec();

    if (!contactMessage) {
      throw new NotFoundException('رسالة التواصل غير موجودة');
    }

    const subject =
      dto.subject?.trim() || `رد بخصوص رسالتكم: ${contactMessage.subject.trim()}`;
    const body = dto.body.trim();
    const now = new Date();

    let sentSuccessfully = false;
    let sendError: string | undefined;

    try {
      await this.contactMailService.sendReplyEmail({
        to: contactMessage.email,
        name: contactMessage.name,
        subject,
        body,
      });
      sentSuccessfully = true;
    } catch (error) {
      sendError =
        error instanceof Error ? error.message : 'تعذر إرسال البريد الإلكتروني حالياً';
      this.logger.error(
        `Failed to send contact reply to ${contactMessage.email}: ${sendError}`,
      );
    }

    contactMessage.replies.push({
      body,
      subject,
      repliedBy,
      repliedAt: now,
      sentSuccessfully,
      error: sendError,
    });

    if (sentSuccessfully) {
      contactMessage.status = ContactMessageStatus.REPLIED;
      contactMessage.lastRepliedAt = now;
      contactMessage.lastReplyBy = repliedBy;
      contactMessage.isRead = true;
      contactMessage.readAt = contactMessage.readAt || now;
      contactMessage.archivedAt = undefined;
    }

    await contactMessage.save();

    if (!sentSuccessfully) {
      throw new BadRequestException(sendError || 'تعذر إرسال البريد الإلكتروني حالياً');
    }

    return {
      sent: true,
      message: contactMessage,
    };
  }

  private async notifySupport(message: ContactMessageDocument): Promise<void> {
    const notifyTo = this.configService.get<string>('contact.notifyTo');
    if (!notifyTo?.trim()) {
      return;
    }

    if (!this.contactMailService.isConfigured()) {
      this.logger.warn('CONTACT_NOTIFY_TO is set but mail transport is not configured');
      return;
    }

    try {
      await this.contactMailService.sendContactNotification({
        to: notifyTo.trim(),
        messageId: message._id.toString(),
        name: message.name,
        email: message.email,
        subject: message.subject,
        message: message.message,
        createdAt: message.createdAt,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send contact notification email: ${(error as Error).message}`,
      );
    }
  }

  private async sendAutoAckIfEnabled(message: ContactMessageDocument): Promise<void> {
    const autoAckEnabled = this.configService.get<boolean>('contact.autoAckEnabled');
    if (!autoAckEnabled) {
      return;
    }

    if (!this.contactMailService.isConfigured()) {
      this.logger.warn('CONTACT_AUTO_ACK_ENABLED is true but mail transport is not configured');
      return;
    }

    try {
      await this.contactMailService.sendAutoAckEmail({
        to: message.email,
        name: message.name,
        subject: message.subject,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send auto acknowledgment email to ${message.email}: ${(error as Error).message}`,
      );
    }
  }

  private async enforceRateLimit(key: string, limitPerMinute: number): Promise<void> {
    const rateLimitKey = `contact:rate-limit:${key}`;
    const current = (await this.cacheManager.get<number>(rateLimitKey)) || 0;

    if (current >= limitPerMinute) {
      throw new HttpException(
        'تم تجاوز الحد المسموح من الرسائل. حاول لاحقاً',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    await this.cacheManager.set(rateLimitKey, current + 1, 60000);
  }
}
