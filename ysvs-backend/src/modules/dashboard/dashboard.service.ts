import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event, EventDocument, EventStatus } from '../events/schemas/event.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Certificate, CertificateDocument } from '../certificates/schemas/certificate.schema';
import { Article, ArticleDocument } from '../content/schemas/article.schema';
import {
  Registration,
  RegistrationDocument,
} from '../events/schemas/registration.schema';
import { UserRole } from '../../common/decorators/roles.decorator';

export interface DashboardStatsDto {
  eventsCount: number;
  eventsChange: number;
  membersCount: number;
  membersChange: number;
  certificatesCount: number;
  certificatesChange: number;
  articlesCount: number;
  articlesChange: number;
  upcomingEvents: Event[];
  recentActivities: ActivityDto[];
}

export interface ActivityDto {
  id: string;
  type: 'registration' | 'article' | 'certificate' | 'member';
  message: string;
  timestamp: Date;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Certificate.name) private certificateModel: Model<CertificateDocument>,
    @InjectModel(Article.name) private articleModel: Model<ArticleDocument>,
    @InjectModel(Registration.name)
    private registrationModel: Model<RegistrationDocument>,
  ) {}

  private startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  async getStats(): Promise<DashboardStatsDto> {
    const now = new Date();
    const startThisMonth = this.startOfMonth(now);
    const startLastMonth = this.startOfMonth(
      new Date(now.getFullYear(), now.getMonth() - 1, 1),
    );

    const [
      eventsCount,
      eventsThisMonth,
      eventsLastMonth,
      membersCount,
      membersThisMonth,
      membersLastMonth,
      certificatesCount,
      certificatesThisMonth,
      certificatesLastMonth,
      articlesCount,
      articlesThisMonth,
      articlesLastMonth,
      upcomingEvents,
      recentActivities,
    ] = await Promise.all([
      this.eventModel.countDocuments(),
      this.eventModel.countDocuments({ createdAt: { $gte: startThisMonth } }),
      this.eventModel.countDocuments({
        createdAt: { $gte: startLastMonth, $lt: startThisMonth },
      }),
      this.userModel.countDocuments({ role: UserRole.MEMBER }),
      this.userModel.countDocuments({
        role: UserRole.MEMBER,
        createdAt: { $gte: startThisMonth },
      }),
      this.userModel.countDocuments({
        role: UserRole.MEMBER,
        createdAt: { $gte: startLastMonth, $lt: startThisMonth },
      }),
      this.certificateModel.countDocuments(),
      this.certificateModel.countDocuments({
        createdAt: { $gte: startThisMonth },
      }),
      this.certificateModel.countDocuments({
        createdAt: { $gte: startLastMonth, $lt: startThisMonth },
      }),
      this.articleModel.countDocuments(),
      this.articleModel.countDocuments({
        createdAt: { $gte: startThisMonth },
      }),
      this.articleModel.countDocuments({
        createdAt: { $gte: startLastMonth, $lt: startThisMonth },
      }),
      this.getUpcomingEvents(5),
      this.getRecentActivities(10),
    ]);

    return {
      eventsCount,
      eventsChange: eventsThisMonth - eventsLastMonth,
      membersCount,
      membersChange: membersThisMonth - membersLastMonth,
      certificatesCount,
      certificatesChange: certificatesThisMonth - certificatesLastMonth,
      articlesCount,
      articlesChange: articlesThisMonth - articlesLastMonth,
      upcomingEvents,
      recentActivities,
    };
  }

  private async getUpcomingEvents(limit: number): Promise<Event[]> {
    return this.eventModel
      .find({
        status: EventStatus.UPCOMING,
        startDate: { $gt: new Date() },
      })
      .select('titleAr titleEn slug startDate endDate location coverImage status')
      .sort({ startDate: 1 })
      .limit(limit)
      .lean()
      .exec() as Promise<Event[]>;
  }

  private async getRecentActivities(limit: number): Promise<ActivityDto[]> {
    const [registrations, articles, certificates, members] = await Promise.all([
      this.registrationModel
        .find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('event', 'titleAr')
        .lean()
        .exec(),
      this.articleModel
        .find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('titleAr createdAt')
        .lean()
        .exec(),
      this.certificateModel
        .find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('recipientNameAr createdAt')
        .lean()
        .exec(),
      this.userModel
        .find({ role: UserRole.MEMBER })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('fullNameAr createdAt')
        .lean()
        .exec(),
    ]);

    const activities: ActivityDto[] = [
      ...registrations.map((r: any) => ({
        id: r._id.toString(),
        type: 'registration' as const,
        message: `تسجيل جديد في ${r.event?.titleAr || 'مؤتمر'}`,
        timestamp: r.createdAt,
      })),
      ...articles.map((a: any) => ({
        id: a._id.toString(),
        type: 'article' as const,
        message: `خبر جديد: ${a.titleAr}`,
        timestamp: a.createdAt,
      })),
      ...certificates.map((c: any) => ({
        id: c._id.toString(),
        type: 'certificate' as const,
        message: `شهادة صادرة لـ ${c.recipientNameAr}`,
        timestamp: c.createdAt,
      })),
      ...members.map((m: any) => ({
        id: m._id.toString(),
        type: 'member' as const,
        message: `عضو جديد: ${m.fullNameAr}`,
        timestamp: m.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    return activities;
  }

  async getActivities(limit: number = 10): Promise<ActivityDto[]> {
    return this.getRecentActivities(limit);
  }
}
