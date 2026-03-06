import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  Certificate,
  CertificateDocument,
  CertificateHolderType,
} from './schemas/certificate.schema';
import {
  CertificateTemplate,
  CertificateTemplateDocument,
} from './schemas/certificate-template.schema';
import { PdfGeneratorService } from './services/pdf-generator.service';
import { SerialGeneratorService } from './services/serial-generator.service';
import { CertificateMailService } from './services/certificate-mail.service';
import { RegistrationService } from '../events/registration.service';
import { MediaService } from '../media/media.service';
import { MediaType } from '../media/dto';
import { CreateTemplateDto, RevokeCertificateDto } from './dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { NotificationsPublisherService } from '../notifications/notifications.publisher.service';

@Injectable()
export class CertificatesService {
  private readonly logger = new Logger(CertificatesService.name);

  constructor(
    @InjectModel(Certificate.name)
    private certificateModel: Model<CertificateDocument>,
    @InjectModel(CertificateTemplate.name)
    private templateModel: Model<CertificateTemplateDocument>,
    private pdfGeneratorService: PdfGeneratorService,
    private serialGeneratorService: SerialGeneratorService,
    private registrationService: RegistrationService,
    private mediaService: MediaService,
    private certificateMailService: CertificateMailService,
    private configService: ConfigService,
    private jwtService: JwtService,
    private readonly notificationsPublisherService: NotificationsPublisherService,
  ) {}

  // ============= CERTIFICATES =============

  async generateCertificate(
    registrationId: string,
    templateId?: string,
    emitNotification: boolean = true,
  ): Promise<Certificate> {
    // Check if certificate already exists
    const existingCert = await this.certificateModel.findOne({
      registration: registrationId,
    });

    if (existingCert) {
      throw new BadRequestException('الشهادة موجودة مسبقاً لهذا التسجيل');
    }

    // Get registration with populated data
    const registration = await this.registrationService.findById(registrationId);

    if (!registration) {
      throw new NotFoundException('التسجيل غير موجود');
    }

    // Get template
    let template: CertificateTemplateDocument | null = null;
    if (templateId) {
      template = await this.templateModel.findById(templateId);
    } else {
      template = await this.templateModel.findOne({ isDefault: true, isActive: true });
    }

    // Generate serial number
    const serialNumber = await this.serialGeneratorService.generateSerialNumber();

    // Generate verification URL
    const verificationUrl =
      this.pdfGeneratorService.generateVerificationUrl(serialNumber);

    // Prepare certificate data
    const user = registration.user as any;
    const event = registration.event as any;
    const registrationData = registration as any;

    const recipientNameAr =
      user?.fullNameAr ||
      registrationData.participantNameArSnapshot ||
      this.extractNameFromFormData(registrationData.formData) ||
      'ضيف';
    const recipientNameEn =
      user?.fullNameEn ||
      registrationData.participantNameEnSnapshot ||
      this.extractNameFromFormData(registrationData.formData) ||
      'Guest';
    const holderType = user
      ? CertificateHolderType.USER
      : CertificateHolderType.GUEST;
    const holderEmail =
      user?.email?.toLowerCase() || registrationData.guestEmailNormalized;

    const certificateData = {
      serialNumber,
      recipientNameAr,
      recipientNameEn,
      eventTitleAr: event.titleAr,
      eventTitleEn: event.titleEn,
      cmeHours: event.cmeHours || 0,
      issueDate: new Date(),
      eventDate: event.startDate,
      verificationUrl,
    };

    // Generate PDF
    const { buffer } = await this.pdfGeneratorService.generateCertificatePdf(
      certificateData,
      template || undefined,
    );

    const eventId = event._id.toString();
    const issueDate = new Date();
    const folder = this.buildCertificateFolder(eventId, issueDate);
    const uploadedPdf = await this.mediaService.uploadBuffer({
      buffer,
      originalName: `${serialNumber}.pdf`,
      mimetype: 'application/pdf',
      type: MediaType.DOCUMENT,
      folder,
      filename: serialNumber,
    });
    const pdfPath = uploadedPdf.path;

    // Create certificate record
    const certificate = new this.certificateModel({
      registration: registrationId,
      event: event._id,
      user: user?._id,
      holderType,
      holderEmail,
      serialNumber,
      qrCode: verificationUrl,
      recipientNameAr,
      recipientNameEn,
      eventTitleAr: event.titleAr,
      eventTitleEn: event.titleEn,
      cmeHours: event.cmeHours || 0,
      issueDate,
      eventDate: event.startDate,
      templateUsed: template?.name,
      pdfPath,
      pdfUrl: uploadedPdf.url,
    });

    const savedCertificate = await certificate.save();

    // Mark registration as certificate issued
    await this.registrationService.markCertificateIssued(registrationId);

    this.logger.log(`Certificate generated: ${serialNumber}`);

    if (holderType === CertificateHolderType.GUEST && holderEmail) {
      try {
        await this.sendGuestCertificateEmail(savedCertificate._id.toString());
      } catch (error) {
        this.logger.warn(
          `Certificate created but guest email delivery failed for ${serialNumber}: ${(error as Error).message}`,
        );
      }
    }

    if (emitNotification) {
      this.notificationsPublisherService.publishToAdmins({
        type: 'certificate.issued',
        title: 'تم إصدار شهادة',
        message: `تم إصدار شهادة لـ ${savedCertificate.recipientNameAr} في ${savedCertificate.eventTitleAr}`,
        entityId: savedCertificate._id.toString(),
        entityType: 'certificate',
        severity: 'success',
        actionUrl: '/admin/certificates',
        meta: {
          serialNumber: savedCertificate.serialNumber,
          eventId: eventId,
          holderType: savedCertificate.holderType,
        },
      });
    }

    return savedCertificate;
  }

  async generateBulkCertificates(
    eventId: string,
    templateId?: string,
    registrationIds?: string[],
  ): Promise<{ generated: number; skipped: number; errors: string[] }> {
    const attendedRegistrations =
      await this.registrationService.getAttendedRegistrations(eventId);
    const filterRegistrationIds =
      registrationIds && registrationIds.length > 0
        ? new Set(registrationIds)
        : null;
    const registrations = filterRegistrationIds
      ? attendedRegistrations.filter((registration) =>
          filterRegistrationIds.has(registration._id.toString()),
        )
      : attendedRegistrations;

    let generated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const registration of registrations) {
      try {
        await this.generateCertificate(
          registration._id.toString(),
          templateId,
          false,
        );
        generated++;
      } catch (error) {
        if (error instanceof BadRequestException) {
          skipped++;
        } else {
          errors.push(
            `Registration ${registration._id}: ${(error as Error).message}`,
          );
        }
      }
    }

    this.logger.log(
      `Bulk generation for event ${eventId}: ${generated} generated, ${skipped} skipped, ${errors.length} errors`,
    );

    if (generated > 0) {
      this.notificationsPublisherService.publishToAdmins({
        type: 'certificate.bulk_issued',
        title: 'إصدار شهادات دفعي',
        message: `تم إصدار ${generated} شهادة في عملية دفعية${errors.length ? ` مع ${errors.length} أخطاء` : ''}`,
        entityId: eventId,
        entityType: 'event',
        severity: errors.length ? 'warning' : 'success',
        actionUrl: '/admin/certificates',
        meta: {
          eventId,
          generated,
          skipped,
          errorsCount: errors.length,
        },
      });
    }

    return { generated, skipped, errors };
  }

  async verifyCertificate(serialNumber: string): Promise<{
    valid: boolean;
    certificate?: Partial<Certificate>;
    message: string;
  }> {
    const certificate = await this.certificateModel.findOne({ serialNumber });

    if (!certificate) {
      return {
        valid: false,
        message: 'الشهادة غير موجودة',
      };
    }

    if (!certificate.isValid) {
      return {
        valid: false,
        certificate: {
          serialNumber: certificate.serialNumber,
          revokedAt: certificate.revokedAt,
          revokedReason: certificate.revokedReason,
        },
        message: 'الشهادة ملغاة',
      };
    }

    return {
      valid: true,
      certificate: {
        serialNumber: certificate.serialNumber,
        recipientNameAr: certificate.recipientNameAr,
        recipientNameEn: certificate.recipientNameEn,
        eventTitleAr: certificate.eventTitleAr,
        eventTitleEn: certificate.eventTitleEn,
        cmeHours: certificate.cmeHours,
        issueDate: certificate.issueDate,
        eventDate: certificate.eventDate,
      },
      message: 'الشهادة صالحة',
    };
  }

  async findAll(
    paginationDto: PaginationDto,
    search?: string,
  ): Promise<PaginatedResult<Certificate>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (search && search.trim()) {
      const trimmed = search.trim();
      filter.$or = [
        { serialNumber: { $regex: trimmed, $options: 'i' } },
        { recipientNameAr: { $regex: trimmed, $options: 'i' } },
        { recipientNameEn: { $regex: trimmed, $options: 'i' } },
      ];
    }

    const [certificates, total] = await Promise.all([
      this.certificateModel
        .find(filter)
        .populate('user', 'fullNameAr fullNameEn email')
        .populate('event', 'titleAr titleEn slug startDate')
        .skip(skip)
        .limit(limit)
        .sort({ issueDate: -1 })
        .exec(),
      this.certificateModel.countDocuments(filter),
    ]);

    return new PaginatedResult(certificates, total, page, limit);
  }

  async findByUser(userId: string): Promise<Certificate[]> {
    return this.certificateModel
      .find({ user: userId, isValid: true })
      .populate('event', 'titleAr titleEn slug startDate')
      .sort({ issueDate: -1 })
      .exec();
  }

  async findByEvent(
    eventId: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Certificate>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [certificates, total] = await Promise.all([
      this.certificateModel
        .find({ event: eventId })
        .populate('user', 'fullNameAr fullNameEn email')
        .skip(skip)
        .limit(limit)
        .sort({ issueDate: -1 })
        .exec(),
      this.certificateModel.countDocuments({ event: eventId }),
    ]);

    return new PaginatedResult(certificates, total, page, limit);
  }

  async findById(id: string): Promise<Certificate> {
    const certificate = await this.certificateModel
      .findById(id)
      .populate('user', 'fullNameAr fullNameEn email')
      .populate('event', 'titleAr titleEn slug startDate')
      .exec();

    if (!certificate) {
      throw new NotFoundException('الشهادة غير موجودة');
    }

    return certificate;
  }

  async revokeCertificate(
    id: string,
    revokeDto: RevokeCertificateDto,
    revokedByUserId: string,
  ): Promise<Certificate> {
    const certificate = await this.certificateModel.findById(id);

    if (!certificate) {
      throw new NotFoundException('الشهادة غير موجودة');
    }

    if (!certificate.isValid) {
      throw new BadRequestException('الشهادة ملغاة مسبقاً');
    }

    certificate.isValid = false;
    certificate.revokedAt = new Date();
    certificate.revokedReason = revokeDto.reason;
    certificate.revokedBy = revokedByUserId as any;

    await certificate.save();

    this.logger.log(`Certificate revoked: ${certificate.serialNumber}`);

    return certificate;
  }

  async getCertificatePdfPath(id: string, userId: string): Promise<string> {
    const certificate = await this.certificateModel.findById(id);

    if (!certificate) {
      throw new NotFoundException('الشهادة غير موجودة');
    }

    // Check ownership (unless admin - handled at controller level)
    if (!certificate.user || certificate.user.toString() !== userId) {
      throw new BadRequestException('ليس لديك صلاحية تحميل هذه الشهادة');
    }

    if (!certificate.pdfPath) {
      throw new NotFoundException('ملف الشهادة غير موجود');
    }

    return certificate.pdfPath;
  }

  resolveCertificatePublicUrl(certificate: {
    pdfPath?: string;
    pdfUrl?: string;
  }): string {
    if (certificate.pdfUrl) {
      return certificate.pdfUrl;
    }

    if (!certificate.pdfPath) {
      throw new NotFoundException('ملف الشهادة غير موجود');
    }

    if (this.isAbsoluteUrl(certificate.pdfPath)) {
      return certificate.pdfPath;
    }

    const normalizedPath = certificate.pdfPath.replace(/^[/\\]+/, '').replace(/\\/g, '/');
    const r2PublicUrl = this.configService.get<string>('storage.r2PublicUrl') || '';

    if (!r2PublicUrl) {
      throw new BadRequestException('رابط R2_PUBLIC_URL غير مضبوط');
    }

    return `${r2PublicUrl.replace(/\/$/, '')}/${normalizedPath}`;
  }

  async sendGuestCertificateEmail(certificateId: string): Promise<{ sent: boolean }> {
    const certificate = await this.certificateModel.findById(certificateId);

    if (!certificate) {
      throw new NotFoundException('الشهادة غير موجودة');
    }

    if (certificate.holderType !== CertificateHolderType.GUEST || !certificate.holderEmail) {
      throw new BadRequestException('إرسال البريد متاح فقط لشهادات الضيوف');
    }

    const token = this.createGuestDownloadToken(certificate._id.toString());
    const frontendUrl =
      this.configService.get<string>('app.frontendUrl') || 'http://localhost:5173';
    const downloadUrl = `${frontendUrl}/certificate-download?token=${token}`;

    try {
      await this.certificateMailService.sendGuestCertificateEmail({
        to: certificate.holderEmail,
        recipientNameAr: certificate.recipientNameAr,
        recipientNameEn: certificate.recipientNameEn,
        eventTitleAr: certificate.eventTitleAr,
        serialNumber: certificate.serialNumber,
        downloadUrl,
      });

      certificate.guestEmailSentAt = new Date();
      certificate.guestEmailLastError = undefined;
      certificate.guestDownloadTokenIssuedAt = new Date();
      await certificate.save();

      return { sent: true };
    } catch (error) {
      certificate.guestEmailLastError =
        error instanceof Error ? error.message : 'فشل إرسال البريد';
      await certificate.save();
      this.logger.error(
        `Failed to send guest certificate email for ${certificate.serialNumber}: ${certificate.guestEmailLastError}`,
      );
      throw new BadRequestException(certificate.guestEmailLastError);
    }
  }

  async getGuestCertificatePdfPath(token: string): Promise<string> {
    let payload: { certificateId: string; type: string };

    try {
      payload = this.jwtService.verify(token, {
        secret:
          this.configService.get<string>('jwt.secret') ||
          'ysvs-certificates-secret',
      }) as { certificateId: string; type: string };
    } catch {
      throw new BadRequestException('رابط تحميل الشهادة غير صالح أو منتهي');
    }

    if (payload.type !== 'guest_certificate_download') {
      throw new BadRequestException('نوع الرابط غير صالح');
    }

    const certificate = await this.certificateModel.findById(payload.certificateId);

    if (!certificate) {
      throw new NotFoundException('الشهادة غير موجودة');
    }

    if (certificate.holderType !== CertificateHolderType.GUEST) {
      throw new BadRequestException('هذا الرابط مخصص لشهادات الضيوف فقط');
    }

    if (!certificate.isValid) {
      throw new BadRequestException('لا يمكن تحميل شهادة ملغاة');
    }

    if (!certificate.pdfPath) {
      throw new NotFoundException('ملف الشهادة غير موجود');
    }

    return certificate.pdfPath;
  }

  async linkGuestCertificatesToUser(userId: string, email: string): Promise<{
    linked: number;
  }> {
    const normalizedEmail = email.trim().toLowerCase();

    const updateResult = await this.certificateModel.updateMany(
      {
        holderEmail: normalizedEmail,
        $or: [{ user: { $exists: false } }, { user: null }],
      },
      {
        $set: {
          user: userId,
          holderType: CertificateHolderType.USER,
        },
      },
    );

    return {
      linked: updateResult.modifiedCount,
    };
  }

  // ============= TEMPLATES =============

  async createTemplate(
    createTemplateDto: CreateTemplateDto,
  ): Promise<CertificateTemplate> {
    // If this is set as default, unset other defaults
    if (createTemplateDto.isDefault) {
      await this.templateModel.updateMany(
        { isDefault: true },
        { isDefault: false },
      );
    }

    const template = new this.templateModel(createTemplateDto);
    return template.save();
  }

  async findAllTemplates(): Promise<CertificateTemplate[]> {
    return this.templateModel.find({ isActive: true }).sort({ name: 1 }).exec();
  }

  async findTemplateById(id: string): Promise<CertificateTemplate> {
    const template = await this.templateModel.findById(id);

    if (!template) {
      throw new NotFoundException('القالب غير موجود');
    }

    return template;
  }

  async updateTemplate(
    id: string,
    updateData: Partial<CreateTemplateDto>,
  ): Promise<CertificateTemplate> {
    // If setting as default, unset other defaults
    if (updateData.isDefault) {
      await this.templateModel.updateMany(
        { isDefault: true, _id: { $ne: id } },
        { isDefault: false },
      );
    }

    const template = await this.templateModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true },
    );

    if (!template) {
      throw new NotFoundException('القالب غير موجود');
    }

    return template;
  }

  async deleteTemplate(id: string): Promise<void> {
    const template = await this.templateModel.findById(id);

    if (!template) {
      throw new NotFoundException('القالب غير موجود');
    }

    if (template.isDefault) {
      throw new BadRequestException('لا يمكن حذف القالب الافتراضي');
    }

    await this.templateModel.findByIdAndDelete(id);
  }

  private createGuestDownloadToken(certificateId: string): string {
    return this.jwtService.sign(
      {
        certificateId,
        type: 'guest_certificate_download',
      },
      {
        secret:
          this.configService.get<string>('jwt.secret') ||
          'ysvs-certificates-secret',
        expiresIn: '72h',
      },
    );
  }

  private buildCertificateFolder(eventId: string, issueDate: Date): string {
    const year = issueDate.getUTCFullYear();
    const month = `${issueDate.getUTCMonth() + 1}`.padStart(2, '0');
    return `certificates/${eventId}/${year}/${month}`;
  }

  private isAbsoluteUrl(value: string): boolean {
    return /^https?:\/\//i.test(value);
  }

  private extractNameFromFormData(formData: unknown): string | null {
    if (!formData || typeof formData !== 'object') {
      return null;
    }

    const normalizedEntries =
      formData instanceof Map
        ? Array.from(formData.entries())
        : Object.entries(formData as Record<string, unknown>);
    const nameEntry = normalizedEntries.find(([key, value]) => {
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

    if (!nameEntry || typeof nameEntry[1] !== 'string') {
      return null;
    }

    const normalizedValue = nameEntry[1].trim();
    return normalizedValue || null;
  }
}
