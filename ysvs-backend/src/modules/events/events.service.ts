import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import {
  Event,
  EventDocument,
  EventStatus,
  SessionType,
} from './schemas/event.schema';
import { TicketType, TicketTypeDocument } from './schemas/ticket-type.schema';
import {
  CreateEventDto,
  EventsQueryDto,
  UpdateEventDto,
  UpdateFormSchemaDto,
  CreateTicketTypeDto,
} from './dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    @InjectModel(TicketType.name) private ticketTypeModel: Model<TicketTypeDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  // ============= EVENTS =============

  async create(createEventDto: CreateEventDto, userId: string): Promise<Event> {
    this.validateEventPhaseOneFields(createEventDto);

    const event = new this.eventModel({
      ...createEventDto,
      createdBy: userId,
    });

    const savedEvent = await event.save();
    await this.invalidateCache();
    return savedEvent;
  }

  async findAll(paginationDto: PaginationDto): Promise<PaginatedResult<Event>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      this.eventModel
        .find()
        .populate('ticketTypes')
        .skip(skip)
        .limit(limit)
        .sort({ startDate: -1 })
        .exec(),
      this.eventModel.countDocuments(),
    ]);

    return new PaginatedResult(events, total, page, limit);
  }

  async findPublished(queryDto: EventsQueryDto): Promise<PaginatedResult<Event>> {
    const { page = 1, limit = 10, status } = queryDto;
    const cacheKey = `events:published:${page}:${limit}:${status ?? 'all'}`;
    const cached = await this.cacheManager.get<PaginatedResult<Event>>(cacheKey);

    if (cached) {
      return cached;
    }

    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {
      status: { $ne: EventStatus.CANCELLED },
    };
    if (status) {
      query.status = status;
    }

    const [events, total] = await Promise.all([
      this.eventModel
        .find(query)
        .populate('ticketTypes')
        .select('-formSchema')
        .skip(skip)
        .limit(limit)
        .sort({ startDate: -1 })
        .exec(),
      this.eventModel.countDocuments(query),
    ]);

    const result = new PaginatedResult(events, total, page, limit);
    await this.cacheManager.set(cacheKey, result, 300000); // 5 minutes
    return result;
  }

  async findUpcoming(): Promise<Event | null> {
    const cacheKey = 'events:upcoming';
    const cached = await this.cacheManager.get<Event>(cacheKey);

    if (cached) {
      return cached;
    }

    const event = await this.eventModel
      .findOne({
        status: EventStatus.UPCOMING,
        startDate: { $gt: new Date() },
      })
      .select('titleAr titleEn slug startDate endDate location coverImage')
      .sort({ startDate: 1 })
      .exec();

    if (event) {
      await this.cacheManager.set(cacheKey, event, 60000); // 1 minute
    }

    return event;
  }

  async findBySlug(slug: string): Promise<Event> {
    const event = await this.eventModel
      .findOne({ slug })
      .populate('ticketTypes')
      .exec();

    if (!event) {
      throw new NotFoundException('المؤتمر غير موجود');
    }

    return event;
  }

  async checkSlugAvailability(slug: string, excludeId?: string): Promise<boolean> {
    const query: Record<string, unknown> = { slug };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const existing = await this.eventModel.findOne(query).select('_id').lean().exec();
    return !existing;
  }

  async findById(id: string): Promise<Event> {
    const event = await this.eventModel
      .findById(id)
      .populate('ticketTypes')
      .exec();

    if (!event) {
      throw new NotFoundException('المؤتمر غير موجود');
    }

    return event;
  }

  async update(id: string, updateEventDto: UpdateEventDto): Promise<Event> {
    const existingEvent = await this.eventModel.findById(id).exec();
    if (!existingEvent) {
      throw new NotFoundException('المؤتمر غير موجود');
    }

    const mergedEvent = {
      ...existingEvent.toObject(),
      ...updateEventDto,
    } as UpdateEventDto;
    this.validateEventPhaseOneFields(mergedEvent);

    const event = await this.eventModel
      .findByIdAndUpdate(id, updateEventDto, { new: true })
      .populate('ticketTypes')
      .exec();

    if (!event) {
      throw new NotFoundException('المؤتمر غير موجود');
    }

    await this.invalidateCache();
    return event;
  }

  async remove(id: string): Promise<void> {
    const result = await this.eventModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException('المؤتمر غير موجود');
    }

    // Delete associated ticket types
    await this.ticketTypeModel.deleteMany({ event: id });

    await this.invalidateCache();
  }

  // ============= FORM SCHEMA =============

  async updateFormSchema(
    eventId: string,
    updateFormSchemaDto: UpdateFormSchemaDto,
  ): Promise<Event> {
    const event = await this.eventModel
      .findByIdAndUpdate(
        eventId,
        { formSchema: updateFormSchemaDto.formSchema },
        { new: true },
      )
      .exec();

    if (!event) {
      throw new NotFoundException('المؤتمر غير موجود');
    }

    return event;
  }

  async getFormSchema(eventId: string): Promise<Event> {
    const event = await this.eventModel
      .findById(eventId)
      .select('formSchema titleAr titleEn slug')
      .exec();

    if (!event) {
      throw new NotFoundException('المؤتمر غير موجود');
    }

    return event;
  }

  // ============= TICKET TYPES =============

  async createTicketType(createTicketTypeDto: CreateTicketTypeDto): Promise<TicketType> {
    // Verify event exists
    const event = await this.eventModel.findById(createTicketTypeDto.event);
    if (!event) {
      throw new NotFoundException('المؤتمر غير موجود');
    }

    const ticketType = new this.ticketTypeModel(createTicketTypeDto);
    const savedTicketType = await ticketType.save();

    // Add ticket type to event
    await this.eventModel.findByIdAndUpdate(createTicketTypeDto.event, {
      $push: { ticketTypes: savedTicketType._id },
    });

    return savedTicketType;
  }

  async findTicketTypesByEvent(eventId: string): Promise<TicketType[]> {
    return this.ticketTypeModel.find({ event: eventId, isActive: true }).exec();
  }

  async updateTicketType(
    id: string,
    updateData: Partial<CreateTicketTypeDto>,
  ): Promise<TicketType> {
    const ticketType = await this.ticketTypeModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!ticketType) {
      throw new NotFoundException('نوع التذكرة غير موجود');
    }

    return ticketType;
  }

  async deleteTicketType(id: string): Promise<void> {
    const ticketType = await this.ticketTypeModel.findById(id);

    if (!ticketType) {
      throw new NotFoundException('نوع التذكرة غير موجود');
    }

    // Remove from event
    await this.eventModel.findByIdAndUpdate(ticketType.event, {
      $pull: { ticketTypes: id },
    });

    await this.ticketTypeModel.findByIdAndDelete(id);
  }

  // ============= HELPERS =============

  async updateEventStatus(): Promise<void> {
    const now = new Date();

    // Update to ongoing
    await this.eventModel.updateMany(
      {
        status: EventStatus.UPCOMING,
        startDate: { $lte: now },
        endDate: { $gt: now },
      },
      { status: EventStatus.ONGOING },
    );

    // Update to completed
    await this.eventModel.updateMany(
      {
        status: { $in: [EventStatus.UPCOMING, EventStatus.ONGOING] },
        endDate: { $lte: now },
      },
      { status: EventStatus.COMPLETED },
    );

    await this.invalidateCache();
  }

  async incrementAttendees(eventId: string): Promise<void> {
    await this.eventModel.findByIdAndUpdate(eventId, {
      $inc: { currentAttendees: 1 },
    });
  }

  async decrementAttendees(eventId: string): Promise<void> {
    await this.eventModel.findByIdAndUpdate(eventId, {
      $inc: { currentAttendees: -1 },
    });
  }

  private validateEventPhaseOneFields(
    payload: Pick<
      UpdateEventDto,
      | 'startDate'
      | 'endDate'
      | 'outcomes'
      | 'objectives'
      | 'targetAudience'
      | 'location'
      | 'speakers'
      | 'schedule'
    >,
  ): void {
    this.validateTextList(payload.outcomes, 'مخرجات المؤتمر');
    this.validateTextList(payload.objectives, 'أهداف المؤتمر');
    this.validateTextList(payload.targetAudience, 'الفئة المستهدفة');
    this.validateMapUrls(payload.location);
    this.validateScheduleTimeBounds(payload.startDate, payload.endDate, payload.schedule);
    this.validateScheduleSpeakers(payload.speakers, payload.schedule);
  }

  private validateTextList(items: string[] | undefined, label: string): void {
    if (!items) {
      return;
    }

    if (!Array.isArray(items)) {
      throw new BadRequestException(`${label} يجب أن تكون قائمة`);
    }

    if (items.some((item) => typeof item !== 'string' || item.trim().length === 0)) {
      throw new BadRequestException(`كل عنصر في ${label} يجب أن يكون نصاً غير فارغ`);
    }
  }

  private validateMapUrls(location?: {
    googleMapsUrl?: string;
    mapEmbedUrl?: string;
  }): void {
    if (!location) {
      return;
    }

    if (location.googleMapsUrl && !this.isGoogleMapsUrl(location.googleMapsUrl)) {
      throw new BadRequestException('رابط خرائط جوجل غير صالح');
    }

    if (location.mapEmbedUrl && !this.isGoogleMapsEmbedUrl(location.mapEmbedUrl)) {
      throw new BadRequestException('رابط تضمين خرائط جوجل غير صالح');
    }
  }

  private isGoogleMapsUrl(url: string): boolean {
    return /^https?:\/\/(www\.)?google\.[a-z.]+\/maps/i.test(url) || /^https?:\/\/maps\.app\.goo\.gl\//i.test(url);
  }

  private isGoogleMapsEmbedUrl(url: string): boolean {
    return /^https?:\/\/(www\.)?google\.[a-z.]+\/maps\/embed/i.test(url);
  }

  private validateScheduleTimeBounds(
    startDate?: Date,
    endDate?: Date,
    schedule?: Array<{ startTime: Date; endTime: Date }>,
  ): void {
    if (!schedule?.length) {
      return;
    }

    if (!startDate || !endDate) {
      throw new BadRequestException('لا يمكن التحقق من الجدول بدون وقت بداية ونهاية المؤتمر');
    }

    const eventStart = new Date(startDate);
    const eventEnd = new Date(endDate);

    for (const item of schedule) {
      const sessionStart = new Date(item.startTime);
      const sessionEnd = new Date(item.endTime);

      if (Number.isNaN(sessionStart.getTime()) || Number.isNaN(sessionEnd.getTime())) {
        throw new BadRequestException('توقيت الجلسة غير صالح');
      }

      if (sessionStart >= sessionEnd) {
        throw new BadRequestException('وقت بداية الجلسة يجب أن يكون قبل وقت النهاية');
      }

      if (sessionStart < eventStart || sessionEnd > eventEnd) {
        throw new BadRequestException('يجب أن يكون توقيت الجلسة ضمن نطاق وقت المؤتمر');
      }
    }
  }

  private validateScheduleSpeakers(
    speakers?: Array<{ id: string }>,
    schedule?: Array<{ sessionType: SessionType; speakerIds?: string[] }>,
  ): void {
    if (!schedule?.length) {
      return;
    }

    const allowedSpeakerIds = new Set((speakers ?? []).map((speaker) => speaker.id));
    const typesWithoutSpeakers = new Set<SessionType>([
      SessionType.BREAK,
      SessionType.NETWORKING,
      SessionType.OPENING,
      SessionType.CLOSING,
    ]);

    for (const item of schedule) {
      const speakerIds = item.speakerIds ?? [];

      if (!Array.isArray(speakerIds)) {
        throw new BadRequestException('معرفات المتحدثين في الجلسة يجب أن تكون قائمة');
      }

      if (!typesWithoutSpeakers.has(item.sessionType) && speakerIds.length === 0) {
        throw new BadRequestException('الجلسات العلمية تتطلب متحدثاً واحداً على الأقل');
      }

      for (const speakerId of speakerIds) {
        if (!allowedSpeakerIds.has(speakerId)) {
          throw new BadRequestException('تمت الإشارة إلى متحدث غير موجود في قائمة المتحدثين');
        }
      }
    }
  }

  private async invalidateCache(): Promise<void> {
    // Clear specific cache keys
    // Note: In production with Redis, you could use pattern matching
    const keysToDelete = [
      'events:published:1:10',
      'events:published:1:20',
      'events:upcoming',
    ];
    await Promise.all(keysToDelete.map((key) => this.cacheManager.del(key)));
  }
}
