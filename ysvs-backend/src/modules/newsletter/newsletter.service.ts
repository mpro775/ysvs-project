import {
  HttpException,
  HttpStatus,
  Injectable,
  Inject,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import {
  NewsletterSubscriber,
  NewsletterSubscriberDocument,
  NewsletterSubscriberStatus,
} from './schemas/newsletter-subscriber.schema';
import {
  SubscribeNewsletterDto,
  UnsubscribeNewsletterDto,
  NewsletterQueryDto,
  UpdateSubscriberStatusDto,
} from './dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { NewsletterMailService } from './services/newsletter-mail.service';
import { NotificationsPublisherService } from '../notifications/notifications.publisher.service';

@Injectable()
export class NewsletterService {
  private readonly logger = new Logger(NewsletterService.name);

  constructor(
    @InjectModel(NewsletterSubscriber.name)
    private readonly subscriberModel: Model<NewsletterSubscriberDocument>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
    private readonly newsletterMailService: NewsletterMailService,
    private readonly notificationsPublisherService: NotificationsPublisherService,
  ) {}

  async subscribe(
    dto: SubscribeNewsletterDto,
    ip: string,
    userAgent: string,
  ): Promise<{ message: string }> {
    await this.enforceRateLimit(
      `subscribe:${ip}`,
      this.configService.get<number>('newsletter.subscribeRateLimitPerMinute') || 6,
    );

    const email = this.normalizeEmail(dto.email);
    const source = dto.source?.trim() || 'website';
    const locale = dto.locale?.trim();
    const now = new Date();

    const existing = await this.subscriberModel.findOne({ email }).exec();
    const doubleOptIn = this.configService.get<boolean>('newsletter.doubleOptIn') !== false;

    const shouldUseDoubleOptIn = doubleOptIn && this.newsletterMailService.isConfigured();
    const subscribeMessage = 'شكراً لاشتراكك في النشرة البريدية.';

    if (existing) {
      existing.source = source;
      existing.locale = locale;
      existing.lastSubscriptionIp = ip;
      existing.lastSubscriptionUserAgent = userAgent;

      if (existing.status === NewsletterSubscriberStatus.SUBSCRIBED) {
        existing.subscribedAt = existing.subscribedAt || now;
        await existing.save();
        return { message: subscribeMessage };
      }

      if (shouldUseDoubleOptIn) {
        const { tokenHash, token, expiresAt } = this.generateConfirmationToken();
        existing.status = NewsletterSubscriberStatus.PENDING;
        existing.confirmTokenHash = tokenHash;
        existing.confirmTokenExpiresAt = expiresAt;
        existing.unsubscribedAt = undefined;
        await existing.save();
        await this.sendConfirmationEmail(email, token);

        return { message: subscribeMessage };
      }

      existing.status = NewsletterSubscriberStatus.SUBSCRIBED;
      existing.subscribedAt = now;
      existing.confirmedAt = now;
      existing.confirmTokenHash = undefined;
      existing.confirmTokenExpiresAt = undefined;
      existing.unsubscribedAt = undefined;
      await existing.save();
      this.emitSubscriptionNotification(existing);

      return { message: subscribeMessage };
    }

    if (shouldUseDoubleOptIn) {
      const { tokenHash, token, expiresAt } = this.generateConfirmationToken();

      await this.subscriberModel.create({
        email,
        status: NewsletterSubscriberStatus.PENDING,
        source,
        locale,
        confirmTokenHash: tokenHash,
        confirmTokenExpiresAt: expiresAt,
        lastSubscriptionIp: ip,
        lastSubscriptionUserAgent: userAgent,
      });

      await this.sendConfirmationEmail(email, token);

      return { message: subscribeMessage };
    }

    const createdSubscriber = await this.subscriberModel.create({
      email,
      status: NewsletterSubscriberStatus.SUBSCRIBED,
      source,
      locale,
      subscribedAt: now,
      confirmedAt: now,
      lastSubscriptionIp: ip,
      lastSubscriptionUserAgent: userAgent,
    });
    this.emitSubscriptionNotification(createdSubscriber);

    return { message: subscribeMessage };
  }

  async confirmSubscription(token: string): Promise<{ message: string }> {
    const tokenHash = this.hashToken(token);
    const now = new Date();

    const subscriber = await this.subscriberModel
      .findOne({
        confirmTokenHash: tokenHash,
        confirmTokenExpiresAt: { $gt: now },
      })
      .exec();

    if (!subscriber) {
      throw new NotFoundException('رابط التأكيد غير صالح أو منتهي الصلاحية');
    }

    subscriber.status = NewsletterSubscriberStatus.SUBSCRIBED;
    subscriber.subscribedAt = now;
    subscriber.confirmedAt = now;
    subscriber.unsubscribedAt = undefined;
    subscriber.confirmTokenHash = undefined;
    subscriber.confirmTokenExpiresAt = undefined;
    await subscriber.save();
    this.emitSubscriptionNotification(subscriber);

    return { message: 'تم تأكيد الاشتراك بنجاح.' };
  }

  async unsubscribe(
    dto: UnsubscribeNewsletterDto,
    ip: string,
  ): Promise<{ message: string }> {
    await this.enforceRateLimit(
      `unsubscribe:${ip}`,
      this.configService.get<number>('newsletter.unsubscribeRateLimitPerMinute') || 12,
    );

    const email = this.normalizeEmail(dto.email);
    const subscriber = await this.subscriberModel.findOne({ email }).exec();

    if (!subscriber) {
      return {
        message: 'إذا كان البريد الإلكتروني مسجلاً، فسيتم إلغاء الاشتراك بنجاح.',
      };
    }

    subscriber.status = NewsletterSubscriberStatus.UNSUBSCRIBED;
    subscriber.unsubscribedAt = new Date();
    subscriber.confirmTokenHash = undefined;
    subscriber.confirmTokenExpiresAt = undefined;
    await subscriber.save();

    return {
      message: 'إذا كان البريد الإلكتروني مسجلاً، فسيتم إلغاء الاشتراك بنجاح.',
    };
  }

  async findAll(queryDto: NewsletterQueryDto): Promise<PaginatedResult<NewsletterSubscriber>> {
    const { page = 1, limit = 10, status, search } = queryDto;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};

    if (status) {
      query.status = status;
    }

    if (search?.trim()) {
      query.email = { $regex: search.trim(), $options: 'i' };
    }

    const [subscribers, total] = await Promise.all([
      this.subscriberModel
        .find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.subscriberModel.countDocuments(query),
    ]);

    return new PaginatedResult(subscribers, total, page, limit);
  }

  async updateStatus(
    id: string,
    dto: UpdateSubscriberStatusDto,
  ): Promise<NewsletterSubscriber> {
    const existing = await this.subscriberModel.findById(id).exec();

    if (!existing) {
      throw new NotFoundException('المشترك غير موجود');
    }

    const now = new Date();
    existing.status = dto.status;

    if (dto.status === NewsletterSubscriberStatus.SUBSCRIBED) {
      existing.subscribedAt = existing.subscribedAt || now;
      existing.confirmedAt = existing.confirmedAt || now;
      existing.unsubscribedAt = undefined;
      existing.confirmTokenHash = undefined;
      existing.confirmTokenExpiresAt = undefined;
    }

    if (dto.status === NewsletterSubscriberStatus.UNSUBSCRIBED) {
      existing.unsubscribedAt = now;
      existing.confirmTokenHash = undefined;
      existing.confirmTokenExpiresAt = undefined;
    }

    if (dto.status === NewsletterSubscriberStatus.PENDING) {
      const { tokenHash, expiresAt } = this.generateConfirmationToken();
      existing.confirmTokenHash = tokenHash;
      existing.confirmTokenExpiresAt = expiresAt;
    }

    await existing.save();
    return existing;
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private generateConfirmationToken(): {
    token: string;
    tokenHash: string;
    expiresAt: Date;
  } {
    const token = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);
    const ttlHours =
      this.configService.get<number>('newsletter.confirmTokenTtlHours') || 48;
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

    return { token, tokenHash, expiresAt };
  }

  private async sendConfirmationEmail(email: string, token: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('app.frontendUrl') || 'http://localhost:5173';
    const confirmUrl = `${frontendUrl}/newsletter/confirm?token=${encodeURIComponent(token)}`;

    try {
      await this.newsletterMailService.sendConfirmationEmail({
        to: email,
        confirmUrl,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send newsletter confirmation email to ${email}: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  private async enforceRateLimit(key: string, limitPerMinute: number): Promise<void> {
    const rateLimitKey = `newsletter:rate-limit:${key}`;
    const current = (await this.cacheManager.get<number>(rateLimitKey)) || 0;

    if (current >= limitPerMinute) {
      throw new HttpException(
        'تم تجاوز الحد المسموح من الطلبات. حاول لاحقاً',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    await this.cacheManager.set(rateLimitKey, current + 1, 60000);
  }

  private emitSubscriptionNotification(subscriber: NewsletterSubscriberDocument): void {
    this.notificationsPublisherService.publishToAdmins({
      type: 'newsletter.subscribed',
      title: 'اشتراك جديد في النشرة',
      message: `تم اشتراك البريد ${subscriber.email}`,
      entityId: subscriber._id.toString(),
      entityType: 'newsletter_subscriber',
      severity: 'info',
      actionUrl: '/admin/newsletter',
      meta: {
        source: subscriber.source,
        status: subscriber.status,
      },
    });
  }
}
