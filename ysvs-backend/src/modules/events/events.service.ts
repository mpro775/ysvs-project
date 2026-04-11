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
  EventMode,
  EventStreamProvider,
  FormField,
  EventDay,
} from './schemas/event.schema';
import { ALL_DEFAULT_PROFILE_FIELD_IDS } from './constants/default-profile-fields';
import { TicketType, TicketTypeDocument } from './schemas/ticket-type.schema';
import {
  CreateEventDto,
  EventsQueryDto,
  UpdateEventDto,
  UpdateFormSchemaDto,
  CreateTicketTypeDto,
} from './dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class EventsService {
  private readonly eventsCacheVersionKey = 'events:cache-version';
  private readonly eventsCacheVersionTtl = 24 * 60 * 60 * 1000;

  private readonly protectedProfileFieldIds = new Set<string>([
    ...ALL_DEFAULT_PROFILE_FIELD_IDS,
  ]);

  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    @InjectModel(TicketType.name) private ticketTypeModel: Model<TicketTypeDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  // ============= EVENTS =============

  async create(createEventDto: CreateEventDto, userId: string): Promise<Event> {
    const normalizedPayload = this.normalizeEventTimeline(createEventDto);
    this.validateEventPhaseOneFields(normalizedPayload, true, true);

    const event = new this.eventModel({
      ...normalizedPayload,
      createdBy: userId,
    });

    const savedEvent = await event.save();
    await this.invalidateCache();
    return savedEvent;
  }

  async findAll(queryDto: EventsQueryDto): Promise<PaginatedResult<Event>> {
    const { page = 1, limit = 10, status } = queryDto;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};
    if (status) {
      query.status = status;
    }

    const [events, total] = await Promise.all([
      this.eventModel
        .find(query)
        .populate('ticketTypes')
        .skip(skip)
        .limit(limit)
        .sort({ startDate: -1 })
        .exec(),
      this.eventModel.countDocuments(query),
    ]);

    return new PaginatedResult(events, total, page, limit);
  }

  async findPublished(queryDto: EventsQueryDto): Promise<PaginatedResult<Event>> {
    const { page = 1, limit = 10, status } = queryDto;
    const cacheVersion = await this.getEventsCacheVersion();
    const cacheKey = `events:published:v${cacheVersion}:${page}:${limit}:${status ?? 'all'}`;
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
        .select('-formSchema -currentAttendees')
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
    const cacheVersion = await this.getEventsCacheVersion();
    const cacheKey = `events:upcoming:v${cacheVersion}`;
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
      .select('-currentAttendees')
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

    const existingEventObject = existingEvent.toObject();
    const mergedEvent = {
      ...existingEventObject,
      ...updateEventDto,
    } as UpdateEventDto;
    const normalizedMergedEvent = this.normalizeEventTimeline(mergedEvent);
    this.validateEventPhaseOneFields(normalizedMergedEvent, false, false);

    const normalizedUpdatePayload = this.normalizeEventTimeline(updateEventDto);

    const event = await this.eventModel
      .findByIdAndUpdate(id, normalizedUpdatePayload, { new: true })
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
      | 'registrationDeadline'
      | 'outcomes'
      | 'objectives'
      | 'targetAudience'
      | 'eventMode'
      | 'hasLiveStream'
      | 'liveStream'
      | 'location'
      | 'speakers'
      | 'schedule'
      | 'eventDays'
      | 'cmeHours'
      | 'formSchema'
      | 'includeDefaultProfileFields'
      | 'defaultProfileFieldIds'
    >,
    enforceFutureStartDate: boolean,
    requireExplicitScheduleDayId: boolean,
  ): void {
    this.validateEventDates(
      payload.startDate,
      payload.endDate,
      payload.registrationDeadline,
      enforceFutureStartDate,
    );
    this.validateTextList(payload.outcomes, 'مخرجات المؤتمر');
    this.validateTextList(payload.objectives, 'أهداف المؤتمر');
    this.validateTextList(payload.targetAudience, 'الفئة المستهدفة');
    this.validateSpeakers(payload.speakers);
    this.validateEventModeAndLocation(payload.eventMode, payload.location);
    this.validateLiveStreamSettings(
      payload.eventMode,
      payload.hasLiveStream,
      payload.liveStream,
    );
    this.validateEventDays(payload.eventDays);
    this.validateScheduleTimeBounds(
      payload.startDate,
      payload.endDate,
      payload.eventDays,
      payload.schedule,
      requireExplicitScheduleDayId,
    );
    this.validateScheduleSpeakers(payload.speakers, payload.schedule);
    this.validateProtectedProfileFields(payload.formSchema);
    this.validateSelectedDefaultProfileFields(
      payload.includeDefaultProfileFields,
      payload.defaultProfileFieldIds,
    );
  }

  private normalizeEventTimeline<T extends Partial<UpdateEventDto>>(payload: T): T {
    const shouldNormalizeDefaultProfileFields =
      Object.prototype.hasOwnProperty.call(payload, 'includeDefaultProfileFields') ||
      Object.prototype.hasOwnProperty.call(payload, 'defaultProfileFieldIds');
    const defaultProfileSettings = shouldNormalizeDefaultProfileFields
      ? this.normalizeDefaultProfileFieldSettings(
          payload.includeDefaultProfileFields,
          payload.defaultProfileFieldIds,
        )
      : {};
    const eventDays = this.normalizeEventDays(payload.eventDays);

    if (!eventDays.length) {
      return {
        ...payload,
        ...defaultProfileSettings,
      };
    }

    const sortedDays = [...eventDays].sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime(),
    );
    const totalCmeHours = sortedDays.reduce((sum, day) => sum + day.cmeHours, 0);

    return {
      ...payload,
      ...defaultProfileSettings,
      eventDays: sortedDays,
      startDate: sortedDays[0].startTime,
      endDate: sortedDays[sortedDays.length - 1].endTime,
      cmeHours: Number(totalCmeHours.toFixed(2)),
    };
  }

  private normalizeEventDays(eventDays?: EventDay[]): EventDay[] {
    if (!eventDays) {
      return [];
    }

    if (!Array.isArray(eventDays)) {
      throw new BadRequestException('أيام المؤتمر يجب أن تكون قائمة');
    }

    if (eventDays.length === 0) {
      throw new BadRequestException('يجب إضافة يوم واحد على الأقل للمؤتمر');
    }

    return eventDays.map((day) => {
      const date = new Date(day.date);
      if (Number.isNaN(date.getTime())) {
        throw new BadRequestException('تاريخ يوم المؤتمر غير صالح');
      }

      const dayDate = new Date(date);
      dayDate.setHours(0, 0, 0, 0);

      const startTime = this.resolveDayTime(day.startTime, dayDate);
      const endTime = this.resolveDayTime(day.endTime, dayDate);

      if (startTime.getTime() >= endTime.getTime()) {
        throw new BadRequestException('وقت نهاية اليوم يجب أن يكون بعد وقت البداية');
      }

      if (typeof day.cmeHours !== 'number' || Number.isNaN(day.cmeHours) || day.cmeHours < 0) {
        throw new BadRequestException('ساعات CME اليومية غير صالحة');
      }

      const dayId =
        typeof day.id === 'string' && day.id.trim().length > 0
          ? day.id.trim()
          : undefined;

      return {
        id: dayId,
        date: dayDate,
        startTime,
        endTime,
        cmeHours: day.cmeHours,
      };
    });
  }

  private resolveDayTime(timeInput: Date, dayDate: Date): Date {
    const parsed = new Date(timeInput);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('توقيت اليوم غير صالح');
    }

    return new Date(
      dayDate.getFullYear(),
      dayDate.getMonth(),
      dayDate.getDate(),
      parsed.getHours(),
      parsed.getMinutes(),
      0,
      0,
    );
  }

  private validateEventDays(eventDays?: EventDay[]): void {
    if (!eventDays?.length) {
      return;
    }

    const seenDates = new Set<string>();
    const seenDayIds = new Set<string>();

    for (const day of eventDays) {
      const key = `${day.date.getFullYear()}-${day.date.getMonth()}-${day.date.getDate()}`;
      const dayId = day.id?.trim();

      if (dayId) {
        if (seenDayIds.has(dayId)) {
          throw new BadRequestException('لا يمكن تكرار معرف اليوم في جدول أيام المؤتمر');
        }
        seenDayIds.add(dayId);
      }

      if (seenDates.has(key)) {
        throw new BadRequestException('لا يمكن تكرار نفس اليوم في جدول أيام المؤتمر');
      }

      seenDates.add(key);
    }
  }

  private validateProtectedProfileFields(formSchema?: FormField[]): void {
    if (!formSchema?.length) {
      return;
    }

    for (const field of formSchema) {
      if (!field?.id) {
        continue;
      }

      if (this.protectedProfileFieldIds.has(field.id)) {
        throw new BadRequestException(
          `الحقل ${field.id} من الحقول الأساسية ويُدار تلقائياً، أضف فقط الحقول الإضافية الخاصة بالمؤتمر`,
        );
      }
    }
  }

  private validateSelectedDefaultProfileFields(
    includeDefaultProfileFields?: boolean,
    defaultProfileFieldIds?: string[],
  ): void {
    const normalized = this.normalizeDefaultProfileFieldSettings(
      includeDefaultProfileFields,
      defaultProfileFieldIds,
    );

    if (!normalized.includeDefaultProfileFields && normalized.defaultProfileFieldIds.length > 0) {
      throw new BadRequestException(
        'لا يمكن اختيار حقول افتراضية مع تعطيل إظهار الحقول الافتراضية',
      );
    }
  }

  private normalizeDefaultProfileFieldSettings(
    includeDefaultProfileFields?: boolean,
    defaultProfileFieldIds?: string[],
  ): { includeDefaultProfileFields: boolean; defaultProfileFieldIds: string[] } {
    const include = includeDefaultProfileFields !== false;

    if (!include) {
      return {
        includeDefaultProfileFields: false,
        defaultProfileFieldIds: [],
      };
    }

    const requestedIds =
      defaultProfileFieldIds === undefined
        ? ALL_DEFAULT_PROFILE_FIELD_IDS
        : defaultProfileFieldIds;
    const normalizedUniqueIds = [...new Set(requestedIds.map((item) => String(item).trim()))].filter(
      Boolean,
    );

    const invalidId = normalizedUniqueIds.find(
      (fieldId) => !this.protectedProfileFieldIds.has(fieldId),
    );
    if (invalidId) {
      throw new BadRequestException(`حقل افتراضي غير صالح: ${invalidId}`);
    }

    return {
      includeDefaultProfileFields: true,
      defaultProfileFieldIds: normalizedUniqueIds,
    };
  }

  private validateEventDates(
    startDate: Date | undefined,
    endDate: Date | undefined,
    registrationDeadline: Date | undefined,
    enforceFutureStartDate: boolean,
  ): void {
    if (!startDate || !endDate) {
      throw new BadRequestException('تاريخ البداية والنهاية مطلوبان');
    }

    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    if (
      Number.isNaN(parsedStartDate.getTime()) ||
      Number.isNaN(parsedEndDate.getTime())
    ) {
      throw new BadRequestException('تاريخ البداية أو النهاية غير صالح');
    }

    if (parsedEndDate.getTime() <= parsedStartDate.getTime()) {
      throw new BadRequestException('تاريخ النهاية يجب أن يكون بعد تاريخ البداية');
    }

    if (enforceFutureStartDate && parsedStartDate.getTime() < Date.now()) {
      throw new BadRequestException('لا يمكن إنشاء مؤتمر بتاريخ بداية في الماضي');
    }

    if (registrationDeadline) {
      const parsedRegistrationDeadline = new Date(registrationDeadline);
      if (Number.isNaN(parsedRegistrationDeadline.getTime())) {
        throw new BadRequestException('موعد إغلاق التسجيل غير صالح');
      }

      if (parsedRegistrationDeadline.getTime() > parsedStartDate.getTime()) {
        throw new BadRequestException(
          'موعد إغلاق التسجيل يجب أن يكون قبل أو يساوي تاريخ بداية المؤتمر',
        );
      }
    }
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

  private validateEventModeAndLocation(
    eventMode: EventMode | undefined,
    location?: {
      venue?: string;
      address?: string;
      city?: string;
      coordinates?: { lat: number; lng: number };
    },
  ): void {
    const resolvedMode = eventMode ?? EventMode.IN_PERSON;

    if (resolvedMode === EventMode.ONLINE) {
      if (location && (location.venue || location.address || location.city || location.coordinates)) {
        throw new BadRequestException('الموقع غير مطلوب للمؤتمر الأونلاين');
      }
      return;
    }

    this.validateLocationCoordinates(location);
  }

  private validateLocationCoordinates(location?: {
    venue?: string;
    address?: string;
    city?: string;
    coordinates?: { lat: number; lng: number };
  }): void {
    if (!location) {
      throw new BadRequestException('بيانات موقع المؤتمر الحضوري مطلوبة');
    }

    const hasLocationDetails = Boolean(
      location.venue || location.address || location.city || location.coordinates,
    );

    if (!hasLocationDetails) {
      throw new BadRequestException('بيانات موقع المؤتمر الحضوري مطلوبة');
    }

    if (!location.venue || !location.address || !location.city) {
      throw new BadRequestException('اسم المكان والعنوان والمدينة مطلوبة للمؤتمر الحضوري');
    }

    if (!location.coordinates) {
      throw new BadRequestException('يرجى تحديد موقع المؤتمر على الخريطة');
    }

    const { lat, lng } = location.coordinates;
    if (
      typeof lat !== 'number' ||
      Number.isNaN(lat) ||
      lat < -90 ||
      lat > 90 ||
      typeof lng !== 'number' ||
      Number.isNaN(lng) ||
      lng < -180 ||
      lng > 180
    ) {
      throw new BadRequestException('إحداثيات الموقع غير صالحة');
    }
  }

  private validateLiveStreamSettings(
    eventMode: EventMode | undefined,
    hasLiveStream: boolean | undefined,
    liveStream?: {
      provider?: EventStreamProvider;
      embedUrl?: string;
      joinUrl?: string;
      recordingAvailable?: boolean;
      recordingUrl?: string;
    },
  ): void {
    const resolvedMode = eventMode ?? EventMode.IN_PERSON;
    const streamEnabled = hasLiveStream ?? false;

    if (!streamEnabled) {
      if (liveStream && Object.keys(liveStream).length > 0) {
        throw new BadRequestException('فعّل خيار البث المباشر أولاً قبل إدخال إعداداته');
      }
      return;
    }

    if (!liveStream) {
      throw new BadRequestException('بيانات البث المباشر مطلوبة عند تفعيل البث');
    }

    if (!liveStream.embedUrl && !liveStream.joinUrl) {
      throw new BadRequestException('يرجى إدخال رابط بث مدمج أو رابط انضمام مباشر');
    }

    if (!liveStream.provider) {
      throw new BadRequestException('يرجى تحديد مزود البث المباشر');
    }

    if (liveStream.recordingUrl && !liveStream.recordingAvailable) {
      throw new BadRequestException('يجب تفعيل خيار التسجيل قبل إدخال رابط إعادة البث');
    }

    if (resolvedMode === EventMode.ONLINE && !liveStream.joinUrl && !liveStream.embedUrl) {
      throw new BadRequestException('المؤتمر الأونلاين يتطلب بيانات دخول واضحة للبث');
    }
  }

  private validateScheduleTimeBounds(
    startDate?: Date,
    endDate?: Date,
    eventDays?: Array<{ id?: string; date: Date; startTime: Date; endTime: Date }>,
    schedule?: Array<{ dayId?: string; startTime: Date; endTime: Date }>,
    requireExplicitScheduleDayId = false,
  ): void {
    if (!schedule?.length) {
      return;
    }

    if (!startDate || !endDate) {
      throw new BadRequestException('لا يمكن التحقق من الجدول بدون وقت بداية ونهاية المؤتمر');
    }

    const eventStart = new Date(startDate);
    const eventEnd = new Date(endDate);
    const hasEventDays = Boolean(eventDays?.length);
    const dayById = new Map<string, { date: Date; startTime: Date; endTime: Date }>();
    const dayByDateKey = new Map<string, { date: Date; startTime: Date; endTime: Date }>();

    for (const day of eventDays ?? []) {
      if (day.id) {
        dayById.set(day.id, day);
      }
      dayByDateKey.set(this.toDayKey(day.date), day);
    }

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

      if (!hasEventDays && !requireExplicitScheduleDayId) {
        continue;
      }

      const selectedDayId = item.dayId?.trim();
      if (requireExplicitScheduleDayId && !selectedDayId) {
        throw new BadRequestException('يجب تحديد اليوم المرتبط بكل جلسة');
      }

      let matchedDay = selectedDayId ? dayById.get(selectedDayId) : undefined;
      if (!matchedDay && !requireExplicitScheduleDayId) {
        matchedDay = dayByDateKey.get(this.toDayKey(sessionStart));
      }

      if (!matchedDay) {
        throw new BadRequestException('اليوم المحدد للجلسة غير موجود ضمن أيام المؤتمر');
      }

      if (sessionStart < matchedDay.startTime || sessionEnd > matchedDay.endTime) {
        throw new BadRequestException('يجب أن تكون الجلسة ضمن وقت اليوم المرتبط بها');
      }
    }
  }

  private toDayKey(dateInput: Date): string {
    const date = new Date(dateInput);
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  }

  private validateScheduleSpeakers(
    speakers?: Array<{ id: string }>,
    schedule?: Array<{ sessionType: SessionType; speakerIds?: string[] }>,
  ): void {
    if (!schedule?.length) {
      return;
    }

    const allowedSpeakerIds = new Set((speakers ?? []).map((speaker) => speaker.id));

    for (const item of schedule) {
      const speakerIds = item.speakerIds ?? [];

      if (!Array.isArray(speakerIds)) {
        throw new BadRequestException('معرفات المتحدثين في الجلسة يجب أن تكون قائمة');
      }

      for (const speakerId of speakerIds) {
        if (!allowedSpeakerIds.has(speakerId)) {
          throw new BadRequestException('تمت الإشارة إلى متحدث غير موجود في قائمة المتحدثين');
        }
      }
    }
  }

  private validateSpeakers(
    speakers?: Array<{ id: string; imageMediaId?: string; imageUrl?: string }>,
  ): void {
    if (!speakers?.length) {
      return;
    }

    const ids = new Set<string>();
    for (const speaker of speakers) {
      if (ids.has(speaker.id)) {
        throw new BadRequestException('يوجد تكرار في معرفات المتحدثين');
      }
      ids.add(speaker.id);

      if (speaker.imageMediaId && !speaker.imageUrl) {
        throw new BadRequestException('صورة المتحدث يجب أن تكون مرتبطة بمكتبة الوسائط بشكل صحيح');
      }
    }
  }

  private async invalidateCache(): Promise<void> {
    const currentVersion = await this.getEventsCacheVersion();
    await this.cacheManager.set(
      this.eventsCacheVersionKey,
      currentVersion + 1,
      this.eventsCacheVersionTtl,
    );
  }

  private async getEventsCacheVersion(): Promise<number> {
    const cachedVersion = await this.cacheManager.get<number | string>(
      this.eventsCacheVersionKey,
    );
    const parsedVersion = Number(cachedVersion);

    if (Number.isFinite(parsedVersion) && parsedVersion >= 1) {
      return parsedVersion;
    }

    await this.cacheManager.set(this.eventsCacheVersionKey, 1, this.eventsCacheVersionTtl);
    return 1;
  }
}
