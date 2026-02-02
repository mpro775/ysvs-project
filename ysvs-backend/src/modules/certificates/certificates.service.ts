import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Certificate, CertificateDocument } from './schemas/certificate.schema';
import {
  CertificateTemplate,
  CertificateTemplateDocument,
} from './schemas/certificate-template.schema';
import { PdfGeneratorService } from './services/pdf-generator.service';
import { SerialGeneratorService } from './services/serial-generator.service';
import { RegistrationService } from '../events/registration.service';
import { CreateTemplateDto, RevokeCertificateDto } from './dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

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
  ) {}

  // ============= CERTIFICATES =============

  async generateCertificate(
    registrationId: string,
    templateId?: string,
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

    const certificateData = {
      serialNumber,
      recipientNameAr: user.fullNameAr,
      recipientNameEn: user.fullNameEn,
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

    // Save PDF file
    const pdfPath = await this.pdfGeneratorService.saveCertificatePdf(
      buffer,
      serialNumber,
    );

    // Create certificate record
    const certificate = new this.certificateModel({
      registration: registrationId,
      event: event._id,
      user: user._id,
      serialNumber,
      qrCode: verificationUrl,
      recipientNameAr: user.fullNameAr,
      recipientNameEn: user.fullNameEn,
      eventTitleAr: event.titleAr,
      eventTitleEn: event.titleEn,
      cmeHours: event.cmeHours || 0,
      issueDate: new Date(),
      eventDate: event.startDate,
      templateUsed: template?.name,
      pdfPath,
    });

    const savedCertificate = await certificate.save();

    // Mark registration as certificate issued
    await this.registrationService.markCertificateIssued(registrationId);

    this.logger.log(`Certificate generated: ${serialNumber}`);

    return savedCertificate;
  }

  async generateBulkCertificates(
    eventId: string,
    templateId?: string,
  ): Promise<{ generated: number; skipped: number; errors: string[] }> {
    const registrations =
      await this.registrationService.getAttendedRegistrations(eventId);

    let generated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const registration of registrations) {
      try {
        await this.generateCertificate(
          registration._id.toString(),
          templateId,
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
    if (certificate.user.toString() !== userId) {
      throw new BadRequestException('ليس لديك صلاحية تحميل هذه الشهادة');
    }

    if (!certificate.pdfPath) {
      throw new NotFoundException('ملف الشهادة غير موجود');
    }

    return certificate.pdfPath;
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
}
