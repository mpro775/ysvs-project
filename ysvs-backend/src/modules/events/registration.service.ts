import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import {
  Registration,
  RegistrationDocument,
  RegistrationStatus,
  PaymentStatus,
} from './schemas/registration.schema';
import { Event, EventDocument } from './schemas/event.schema';
import { TicketType, TicketTypeDocument } from './schemas/ticket-type.schema';
import { CreateRegistrationDto } from './dto';
import { FormValidatorService } from './services/form-validator.service';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { EventsService } from './events.service';

@Injectable()
export class RegistrationService {
  constructor(
    @InjectModel(Registration.name)
    private registrationModel: Model<RegistrationDocument>,
    @InjectModel(Event.name)
    private eventModel: Model<EventDocument>,
    @InjectModel(TicketType.name)
    private ticketTypeModel: Model<TicketTypeDocument>,
    private formValidatorService: FormValidatorService,
    private eventsService: EventsService,
  ) {}

  async register(
    eventId: string,
    userId: string,
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

    // Check if user already registered
    const existingRegistration = await this.registrationModel.findOne({
      event: eventId,
      user: userId,
    });

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
      user: userId,
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
        .find({ event: eventId })
        .populate('user', 'fullNameAr fullNameEn email phone')
        .populate('ticketType', 'nameAr nameEn price')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.registrationModel.countDocuments({ event: eventId }),
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
      .findOne({ event: eventId, user: userId })
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

  async markAttendance(id: string): Promise<Registration> {
    const registration = await this.registrationModel.findById(id);

    if (!registration) {
      throw new NotFoundException('التسجيل غير موجود');
    }

    if (registration.status !== RegistrationStatus.CONFIRMED) {
      throw new BadRequestException('لا يمكن تأكيد الحضور لتسجيل غير مؤكد');
    }

    registration.status = RegistrationStatus.ATTENDED;
    registration.attendedAt = new Date();
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

    if (registration.user.toString() !== userId) {
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
        event: eventId,
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

  private generateRegistrationNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `REG-${year}-${random}`;
  }
}
