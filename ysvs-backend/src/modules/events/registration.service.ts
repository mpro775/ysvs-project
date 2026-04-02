import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import {
  Registration,
  RegistrationDocument,
  RegistrationStatus,
  PaymentStatus,
  RegistrationSource,
} from './schemas/registration.schema';
import {
  Event,
  EventDocument,
  FormFieldType,
  GuestEmailMode,
  RegistrationAccess,
} from './schemas/event.schema';
import { TicketType, TicketTypeDocument } from './schemas/ticket-type.schema';
import { CreateRegistrationDto } from './dto';
import { FormValidatorService } from './services/form-validator.service';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { EventsService } from './events.service';
import { MediaService } from '../media/media.service';
import { MediaType } from '../media/dto';
import { User, UserDocument } from '../users/schemas/user.schema';
import { NotificationsPublisherService } from '../notifications/notifications.publisher.service';

const DEFAULT_PROFILE_FIELD_IDS = {
  FULL_NAME_AR: 'fullNameAr',
  FULL_NAME_EN: 'fullNameEn',
  EMAIL: 'email',
  PHONE: 'phone',
  COUNTRY: 'country',
  JOB_TITLE: 'jobTitle',
  SPECIALTY: 'specialty',
  GENDER: 'gender',
  WORKPLACE: 'workplace',
  PROFESSIONAL_CARD_DOCUMENT: 'professionalCardDocument',
  PROFILE_DECLARATION: 'profileDeclaration',
} as const;

const OTHER_OPTION_VALUE = '__other__';
const getOtherFieldId = (fieldId: string) => `${fieldId}__other`;

type GuestProfileData = {
  fullNameAr: string;
  fullNameEn: string;
  email: string;
  phone: string;
  country: string;
  jobTitle: string;
  specialty: string;
  gender: 'male' | 'female';
  workplace: string;
  professionalCardDocument?: {
    key?: string;
    url?: string;
    originalName?: string;
    size?: number;
    mimetype?: string;
  };
  profileDeclaration: boolean;
};

@Injectable()
export class RegistrationService {
  constructor(
    @InjectModel(Registration.name)
    private registrationModel: Model<RegistrationDocument>,
    @InjectModel(Event.name)
    private eventModel: Model<EventDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(TicketType.name)
    private ticketTypeModel: Model<TicketTypeDocument>,
    private formValidatorService: FormValidatorService,
    private eventsService: EventsService,
    private mediaService: MediaService,
    private readonly notificationsPublisherService: NotificationsPublisherService,
  ) {}

  private resolveEventQuery(eventId: string): { $in: Array<string | Types.ObjectId> } {
    const values: Array<string | Types.ObjectId> = [eventId];

    if (Types.ObjectId.isValid(eventId)) {
      values.push(new Types.ObjectId(eventId));
    }

    return { $in: values };
  }

  async uploadRegistrationFile(
    eventId: string,
    userId: string | null,
    fieldId: string,
    file: Express.Multer.File,
  ): Promise<{
    key: string;
    url: string;
    originalName: string;
    size: number;
    mimetype: string;
  }> {
    const event = await this.eventModel.findById(eventId);
    if (!event) {
      throw new NotFoundException('المؤتمر غير موجود');
    }

    if (!event.registrationOpen) {
      throw new BadRequestException('التسجيل في هذا المؤتمر مغلق');
    }

    if (event.registrationDeadline && new Date() > event.registrationDeadline) {
      throw new BadRequestException('انتهى موعد التسجيل في هذا المؤتمر');
    }

    const field = event.formSchema.find((f) => f.id === fieldId);
    const isDefaultProfessionalCardField =
      fieldId === DEFAULT_PROFILE_FIELD_IDS.PROFESSIONAL_CARD_DOCUMENT;

    if (!field && !isDefaultProfessionalCardField) {
      throw new BadRequestException('حقل الملف غير موجود في نموذج المؤتمر');
    }

    if (field && field.type !== FormFieldType.FILE) {
      throw new BadRequestException('حقل الملف غير موجود في نموذج المؤتمر');
    }

    const allowedTypes = isDefaultProfessionalCardField
      ? ['.jpg', '.jpeg', '.png', '.pdf']
      : field?.validation?.fileTypes;
    const maxFileSize = isDefaultProfessionalCardField
      ? 10
      : field?.validation?.maxFileSize;

    this.validateUploadAgainstField(allowedTypes, maxFileSize, file);

    const uploadOwner = userId || `guest-${uuidv4()}`;
    const folder = `event-registrations/${eventId}/${uploadOwner}`;
    const mediaType = file.mimetype.startsWith('image/')
      ? MediaType.IMAGE
      : MediaType.DOCUMENT;
    const uploadedFile = await this.mediaService.uploadFile(file, mediaType, folder);

    return {
      key: uploadedFile.path,
      url: uploadedFile.url,
      originalName: uploadedFile.originalName,
      size: uploadedFile.size,
      mimetype: file.mimetype,
    };
  }

  async register(
    eventId: string,
    userId: string | null,
    createRegistrationDto: CreateRegistrationDto,
  ): Promise<Registration> {
    // Get event
    const event = await this.eventModel.findById(eventId);
    if (!event) {
      throw new NotFoundException('المؤتمر غير موجود');
    }

    // Check if registration is open
    if (!event.registrationOpen) {
      throw new BadRequestException('التسجيل في هذا المؤتمر مغلق');
    }

    // Check registration deadline
    if (event.registrationDeadline && new Date() > event.registrationDeadline) {
      throw new BadRequestException('انتهى موعد التسجيل في هذا المؤتمر');
    }

    // Check max attendees
    if (event.maxAttendees > 0 && event.currentAttendees >= event.maxAttendees) {
      throw new BadRequestException('تم الوصول للحد الأقصى من المسجلين');
    }

    const guestProfile = this.extractGuestProfileData(createRegistrationDto.formData);
    let normalizedGuestEmail: string | undefined =
      createRegistrationDto.guestEmail?.trim().toLowerCase() ||
      guestProfile.email.toLowerCase();

    if (
      createRegistrationDto.guestEmail &&
      guestProfile.email &&
      createRegistrationDto.guestEmail.trim().toLowerCase() !==
        guestProfile.email.toLowerCase()
    ) {
      throw new BadRequestException('البريد الإلكتروني للضيف غير متطابق');
    }

    const registrationAccess =
      event.registrationAccess || RegistrationAccess.AUTHENTICATED_ONLY;
    const guestEmailMode = event.guestEmailMode || GuestEmailMode.REQUIRED;

    if (
      registrationAccess === RegistrationAccess.AUTHENTICATED_ONLY &&
      !userId
    ) {
      throw new BadRequestException(
        'التسجيل في هذا المؤتمر يتطلب تسجيل الدخول',
      );
    }

    let user: UserDocument | null = null;
    if (userId) {
      user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('المستخدم غير موجود');
      }

      await this.updateUserProfileFromRegistrationData(user, createRegistrationDto.formData);
      normalizedGuestEmail = undefined;
    }

    if (!user) {
      this.validateGuestProfileData(guestProfile);

      const guestEmailRequired =
        guestEmailMode === GuestEmailMode.REQUIRED || event.cmeHours > 0;

      if (guestEmailRequired && !normalizedGuestEmail) {
        throw new BadRequestException('البريد الإلكتروني مطلوب للضيف في هذا المؤتمر');
      }
    }

    // Check if participant already registered
    const existingRegistration = user
      ? await this.registrationModel.findOne({
          event: this.resolveEventQuery(eventId),
          user: user._id,
        })
      : normalizedGuestEmail
        ? await this.registrationModel.findOne({
            event: this.resolveEventQuery(eventId),
            guestEmailNormalized: normalizedGuestEmail,
          })
        : null;

    if (existingRegistration) {
      throw new ConflictException('أنت مسجل مسبقاً في هذا المؤتمر');
    }

    // Validate form data against event's form schema
    if (event.formSchema && event.formSchema.length > 0) {
      this.formValidatorService.validateAndThrow(
        event.formSchema,
        createRegistrationDto.formData,
      );
    }

    // Handle ticket type
    let ticketType: TicketTypeDocument | null = null;
    let paymentStatus = PaymentStatus.FREE;

    if (createRegistrationDto.ticketType) {
      ticketType = await this.ticketTypeModel.findById(
        createRegistrationDto.ticketType,
      );

      if (!ticketType) {
        throw new NotFoundException('نوع التذكرة غير موجود');
      }

      if (!ticketType.isActive) {
        throw new BadRequestException('نوع التذكرة غير متاح');
      }

      // Check ticket availability
      if (
        ticketType.maxQuantity > 0 &&
        ticketType.soldQuantity >= ticketType.maxQuantity
      ) {
        throw new BadRequestException('نفدت التذاكر من هذا النوع');
      }

      // Set payment status based on price
      paymentStatus = ticketType.price > 0 ? PaymentStatus.PENDING : PaymentStatus.FREE;

      // Increment sold quantity
      await this.ticketTypeModel.findByIdAndUpdate(ticketType._id, {
        $inc: { soldQuantity: 1 },
      });
    }

    // Generate registration number
    const registrationNumber = this.generateRegistrationNumber();

    // Create registration
    const registration = new this.registrationModel({
      event: eventId,
      user: user?._id,
      registrationSource: user
        ? RegistrationSource.USER
        : RegistrationSource.GUEST,
      guestEmail: normalizedGuestEmail,
      guestEmailNormalized: normalizedGuestEmail,
      identityEmailNormalized:
        user?.email.toLowerCase() || normalizedGuestEmail || `guest:${uuidv4()}`,
      participantNameArSnapshot: user?.fullNameAr || guestProfile.fullNameAr,
      participantNameEnSnapshot: user?.fullNameEn || guestProfile.fullNameEn,
      ticketType: ticketType?._id,
      formData: createRegistrationDto.formData,
      registrationNumber,
      paymentStatus,
      status: paymentStatus === PaymentStatus.FREE 
        ? RegistrationStatus.CONFIRMED 
        : RegistrationStatus.PENDING,
      notes: createRegistrationDto.notes,
    });

    const savedRegistration = await registration.save();

    // Increment event attendees
    await this.eventsService.incrementAttendees(eventId);

    const participantName =
      user?.fullNameAr ||
      guestProfile.fullNameAr ||
      this.extractNameFromFormData(createRegistrationDto.formData) ||
      normalizedGuestEmail ||
      'مشارك جديد';

    this.notificationsPublisherService.publishToAdmins({
      type: 'event.new_registration',
      title: 'تسجيل جديد في مؤتمر',
      message: `${participantName} سجّل في ${event.titleAr}`,
      entityId: savedRegistration._id.toString(),
      entityType: 'registration',
      severity: 'success',
      actionUrl: `/admin/events/${eventId}/registrants`,
      meta: {
        eventId,
        eventTitleAr: event.titleAr,
        registrationSource: savedRegistration.registrationSource,
      },
    });

    return savedRegistration.populate([
      { path: 'event', select: 'titleAr titleEn slug startDate' },
      { path: 'ticketType', select: 'nameAr nameEn price' },
    ]);
  }

  async findByEvent(
    eventId: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Registration>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [registrations, total] = await Promise.all([
      this.registrationModel
        .find({ event: this.resolveEventQuery(eventId) })
        .populate('user', 'fullNameAr fullNameEn email phone')
        .populate('ticketType', 'nameAr nameEn price')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.registrationModel.countDocuments({ event: this.resolveEventQuery(eventId) }),
    ]);

    return new PaginatedResult(registrations, total, page, limit);
  }

  async findByUser(userId: string): Promise<Registration[]> {
    return this.registrationModel
      .find({ user: userId })
      .populate('event', 'titleAr titleEn slug startDate endDate coverImage status')
      .populate('ticketType', 'nameAr nameEn price')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findUserRegistrationForEvent(
    eventId: string,
    userId: string,
  ): Promise<Registration | null> {
    return this.registrationModel
      .findOne({ event: this.resolveEventQuery(eventId), user: userId })
      .populate('event', 'titleAr titleEn slug startDate endDate')
      .populate('ticketType', 'nameAr nameEn price')
      .exec();
  }

  async findById(id: string): Promise<Registration> {
    const registration = await this.registrationModel
      .findById(id)
      .populate('user', 'fullNameAr fullNameEn email phone')
      .populate('event', 'titleAr titleEn slug startDate endDate cmeHours')
      .populate('ticketType', 'nameAr nameEn price')
      .exec();

    if (!registration) {
      throw new NotFoundException('التسجيل غير موجود');
    }

    return registration;
  }

  async updateStatus(
    id: string,
    status: RegistrationStatus,
  ): Promise<Registration> {
    const registration = await this.registrationModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .populate('user', 'fullNameAr fullNameEn email')
      .populate('event', 'titleAr titleEn')
      .exec();

    if (!registration) {
      throw new NotFoundException('التسجيل غير موجود');
    }

    return registration;
  }

  async markAttendance(id: string, attended: boolean = true): Promise<Registration> {
    const registration = await this.registrationModel.findById(id);

    if (!registration) {
      throw new NotFoundException('التسجيل غير موجود');
    }

    if (registration.status === RegistrationStatus.CANCELLED) {
      throw new BadRequestException('لا يمكن تعديل الحضور لتسجيل ملغي');
    }

    if (attended) {
      if (registration.status !== RegistrationStatus.CONFIRMED) {
        throw new BadRequestException('لا يمكن تأكيد الحضور لتسجيل غير مؤكد');
      }
      registration.status = RegistrationStatus.ATTENDED;
      registration.attendedAt = new Date();
    } else {
      registration.status = RegistrationStatus.CONFIRMED;
      registration.set('attendedAt', undefined);
    }
    await registration.save();

    return registration.populate([
      { path: 'user', select: 'fullNameAr fullNameEn email' },
      { path: 'event', select: 'titleAr titleEn cmeHours' },
    ]);
  }

  async cancelRegistration(id: string, userId: string): Promise<void> {
    const registration = await this.registrationModel.findById(id);

    if (!registration) {
      throw new NotFoundException('التسجيل غير موجود');
    }

    if (!registration.user || registration.user.toString() !== userId) {
      throw new BadRequestException('لا يمكنك إلغاء تسجيل شخص آخر');
    }

    if (registration.status === RegistrationStatus.ATTENDED) {
      throw new BadRequestException('لا يمكن إلغاء تسجيل تم حضوره');
    }

    // Decrement ticket sold quantity
    if (registration.ticketType) {
      await this.ticketTypeModel.findByIdAndUpdate(registration.ticketType, {
        $inc: { soldQuantity: -1 },
      });
    }

    // Decrement event attendees
    await this.eventsService.decrementAttendees(registration.event.toString());

    registration.status = RegistrationStatus.CANCELLED;
    await registration.save();
  }

  async getAttendedRegistrations(eventId: string): Promise<Registration[]> {
    return this.registrationModel
      .find({
        event: this.resolveEventQuery(eventId),
        status: RegistrationStatus.ATTENDED,
        certificateIssued: false,
      })
      .populate('user', 'fullNameAr fullNameEn email')
      .exec();
  }

  async markCertificateIssued(registrationId: string): Promise<void> {
    await this.registrationModel.findByIdAndUpdate(registrationId, {
      certificateIssued: true,
    });
  }

  async linkGuestRegistrationsToUser(userId: string, email: string): Promise<{
    linked: number;
    skippedConflicts: number;
    scanned: number;
  }> {
    const normalizedEmail = email.trim().toLowerCase();

    const candidates = await this.registrationModel
      .find(
        {
          identityEmailNormalized: normalizedEmail,
          $or: [{ user: { $exists: false } }, { user: null }],
        },
        { _id: 1, event: 1 },
      )
      .sort({ createdAt: 1 })
      .lean();

    let linked = 0;
    let skippedConflicts = 0;

    for (const registration of candidates) {
      const hasConflict = await this.registrationModel.exists({
        event: registration.event,
        user: userId,
      });

      if (hasConflict) {
        skippedConflicts++;
        continue;
      }

      const updated = await this.registrationModel.updateOne(
        {
          _id: registration._id,
          $or: [{ user: { $exists: false } }, { user: null }],
        },
        {
          $set: {
            user: userId,
          },
        },
      );

      if (updated.modifiedCount > 0) {
        linked++;
      }
    }

    return {
      linked,
      skippedConflicts,
      scanned: candidates.length,
    };
  }

  private generateRegistrationNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `REG-${year}-${random}`;
  }

  private extractNameFromFormData(formData: unknown): string | null {
    if (!formData || typeof formData !== 'object') {
      return null;
    }

    const entries = Object.entries(formData as Record<string, unknown>);
    const candidate = entries.find(([key, value]) => {
      if (typeof value !== 'string') {
        return false;
      }

      const normalizedKey = key.toLowerCase();
      return (
        normalizedKey.includes('name') ||
        normalizedKey.includes('full') ||
        normalizedKey.includes('اسم')
      );
    });

    if (!candidate || typeof candidate[1] !== 'string') {
      return null;
    }

    const value = candidate[1].trim();
    return value || null;
  }

  private extractGuestProfileData(formData: unknown): GuestProfileData {
    const safeData =
      formData && typeof formData === 'object'
        ? (formData as Record<string, unknown>)
        : {};

    const normalizedJobTitle = this.resolveSelectableField(
      safeData,
      DEFAULT_PROFILE_FIELD_IDS.JOB_TITLE,
    );
    const normalizedSpecialty = this.resolveSelectableField(
      safeData,
      DEFAULT_PROFILE_FIELD_IDS.SPECIALTY,
    );
    const normalizedCountry = this.resolveSelectableField(
      safeData,
      DEFAULT_PROFILE_FIELD_IDS.COUNTRY,
    );

    return {
      fullNameAr: String(safeData[DEFAULT_PROFILE_FIELD_IDS.FULL_NAME_AR] || '').trim(),
      fullNameEn: String(safeData[DEFAULT_PROFILE_FIELD_IDS.FULL_NAME_EN] || '').trim(),
      email: String(safeData[DEFAULT_PROFILE_FIELD_IDS.EMAIL] || '').trim(),
      phone: String(safeData[DEFAULT_PROFILE_FIELD_IDS.PHONE] || '').trim(),
      country: normalizedCountry,
      jobTitle: normalizedJobTitle,
      specialty: normalizedSpecialty,
      gender: String(safeData[DEFAULT_PROFILE_FIELD_IDS.GENDER] || '').trim() as
        | 'male'
        | 'female',
      workplace: String(safeData[DEFAULT_PROFILE_FIELD_IDS.WORKPLACE] || '').trim(),
      professionalCardDocument: this.extractUploadedFile(
        safeData[DEFAULT_PROFILE_FIELD_IDS.PROFESSIONAL_CARD_DOCUMENT],
      ),
      profileDeclaration:
        safeData[DEFAULT_PROFILE_FIELD_IDS.PROFILE_DECLARATION] === true,
    };
  }

  private validateGuestProfileData(guestProfile: GuestProfileData): void {
    if (!guestProfile.fullNameAr) {
      throw new BadRequestException('الاسم بالعربي مطلوب للضيف');
    }

    if (!guestProfile.fullNameEn) {
      throw new BadRequestException('الاسم بالإنجليزي مطلوب للضيف');
    }

    if (!guestProfile.email) {
      throw new BadRequestException('البريد الإلكتروني مطلوب للضيف');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guestProfile.email)) {
      throw new BadRequestException('البريد الإلكتروني للضيف غير صالح');
    }

    if (!guestProfile.phone) {
      throw new BadRequestException('رقم الهاتف مطلوب للضيف');
    }

    const normalizedPhone = guestProfile.phone.replace(/[\s\-().]/g, '');
    const phoneRegex = /^(?:\+?967\d{0,9}|7\d{2,8})$/;
    if (!phoneRegex.test(normalizedPhone)) {
      throw new BadRequestException('رقم الهاتف للضيف غير صالح');
    }

    if (!guestProfile.country) {
      throw new BadRequestException('الدولة مطلوبة للضيف');
    }

    if (!guestProfile.jobTitle) {
      throw new BadRequestException('الصفة الوظيفية مطلوبة للضيف');
    }

    if (!guestProfile.specialty) {
      throw new BadRequestException('التخصص مطلوب للضيف');
    }

    if (!guestProfile.workplace) {
      throw new BadRequestException('جهة العمل / المستشفى / الجامعة مطلوبة للضيف');
    }

    if (!['male', 'female'].includes(guestProfile.gender)) {
      throw new BadRequestException('الجنس مطلوب للضيف');
    }

    if (!guestProfile.professionalCardDocument?.url) {
      throw new BadRequestException('رفع صورة بطاقة مزاولة المهنة مطلوب للضيف');
    }

    if (!guestProfile.profileDeclaration) {
      throw new BadRequestException('يجب الموافقة على الإقرار قبل إرسال التسجيل');
    }
  }

  private resolveSelectableField(
    formData: Record<string, unknown>,
    fieldId: string,
  ): string {
    const selected = String(formData[fieldId] || '').trim();

    if (selected === OTHER_OPTION_VALUE) {
      return String(formData[getOtherFieldId(fieldId)] || '').trim();
    }

    return selected;
  }

  private extractUploadedFile(
    value: unknown,
  ):
    | {
        key?: string;
        url?: string;
        originalName?: string;
        size?: number;
        mimetype?: string;
      }
    | undefined {
    if (!value || typeof value !== 'object') {
      return undefined;
    }

    const file = value as {
      key?: unknown;
      url?: unknown;
      originalName?: unknown;
      size?: unknown;
      mimetype?: unknown;
    };

    return {
      key: typeof file.key === 'string' ? file.key : undefined,
      url: typeof file.url === 'string' ? file.url : undefined,
      originalName: typeof file.originalName === 'string' ? file.originalName : undefined,
      size: typeof file.size === 'number' ? file.size : undefined,
      mimetype: typeof file.mimetype === 'string' ? file.mimetype : undefined,
    };
  }

  private async updateUserProfileFromRegistrationData(
    user: UserDocument,
    formData: Record<string, unknown>,
  ): Promise<void> {
    if (!formData || typeof formData !== 'object') {
      return;
    }

    const nextProfile = {
      fullNameAr:
        String(formData[DEFAULT_PROFILE_FIELD_IDS.FULL_NAME_AR] || user.fullNameAr || '').trim() ||
        user.fullNameAr,
      fullNameEn:
        String(formData[DEFAULT_PROFILE_FIELD_IDS.FULL_NAME_EN] || user.fullNameEn || '').trim() ||
        user.fullNameEn,
      phone:
        String(formData[DEFAULT_PROFILE_FIELD_IDS.PHONE] || user.phone || '').trim() || user.phone,
      country:
        this.resolveSelectableField(formData, DEFAULT_PROFILE_FIELD_IDS.COUNTRY) || user.country,
      jobTitle:
        this.resolveSelectableField(formData, DEFAULT_PROFILE_FIELD_IDS.JOB_TITLE) || user.jobTitle,
      specialty:
        this.resolveSelectableField(formData, DEFAULT_PROFILE_FIELD_IDS.SPECIALTY) || user.specialty,
      workplace:
        String(formData[DEFAULT_PROFILE_FIELD_IDS.WORKPLACE] || user.workplace || '').trim() ||
        user.workplace,
      gender:
        formData[DEFAULT_PROFILE_FIELD_IDS.GENDER] === 'male' ||
        formData[DEFAULT_PROFILE_FIELD_IDS.GENDER] === 'female'
          ? (formData[DEFAULT_PROFILE_FIELD_IDS.GENDER] as 'male' | 'female')
          : user.gender,
    };

    await this.userModel.findByIdAndUpdate(user._id, nextProfile).exec();
  }

  private validateUploadAgainstField(
    allowedTypes: string[] | undefined,
    maxFileSizeMb: number | undefined,
    file: Express.Multer.File,
  ): void {
    if (!file) {
      throw new BadRequestException('لم يتم تحديد ملف للرفع');
    }

    if (maxFileSizeMb && file.size > maxFileSizeMb * 1024 * 1024) {
      throw new BadRequestException(`حجم الملف يتجاوز الحد الأقصى (${maxFileSizeMb}MB)`);
    }

    if (!allowedTypes?.length) {
      return;
    }

    const extension = `.${file.originalname.split('.').pop()?.toLowerCase() || ''}`;
    const normalizedMimetype = file.mimetype.toLowerCase();
    const normalizedAllowedTypes = allowedTypes.map((type) => type.trim().toLowerCase());

    const isAllowed = normalizedAllowedTypes.some((allowedType) => {
      if (allowedType.startsWith('.')) {
        return extension === allowedType;
      }

      return normalizedMimetype === allowedType;
    });

    if (!isAllowed) {
      throw new BadRequestException('نوع الملف غير مسموح لهذا الحقل');
    }
  }
}
