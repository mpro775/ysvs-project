import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Res,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';
import { CertificatesService } from './certificates.service';
import {
  CreateCertificateDto,
  BulkGenerateCertificatesDto,
  RevokeCertificateDto,
  CreateTemplateDto,
} from './dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, UserRole } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Certificates')
@Controller('certificates')
export class CertificatesController {
  constructor(
    private readonly certificatesService: CertificatesService,
    private readonly configService: ConfigService,
  ) {}

  // ============= CERTIFICATES =============

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Post('generate/:registrationId')
  @ApiOperation({ summary: 'Generate certificate for a registration (Admin only)' })
  @ApiResponse({ status: 201, description: 'Certificate generated successfully' })
  generateCertificate(
    @Param('registrationId') registrationId: string,
    @Body() createCertificateDto: CreateCertificateDto,
  ) {
    return this.certificatesService.generateCertificate(
      registrationId,
      createCertificateDto.templateId,
    );
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Post('generate-bulk/:eventId')
  @ApiOperation({ summary: 'Generate certificates for all attended registrations (Admin only)' })
  @ApiResponse({ status: 201, description: 'Bulk generation completed' })
  generateBulkCertificates(
    @Param('eventId') eventId: string,
    @Body() bulkDto: BulkGenerateCertificatesDto,
  ) {
    return this.certificatesService.generateBulkCertificates(
      eventId,
      bulkDto.templateId,
    );
  }

  @Public()
  @Get('verify/:serial')
  @ApiOperation({ summary: 'Verify certificate by serial number (Public)' })
  @ApiResponse({ status: 200, description: 'Verification result' })
  verifyCertificate(@Param('serial') serial: string) {
    return this.certificatesService.verifyCertificate(serial);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get()
  @ApiOperation({ summary: 'Get all certificates with pagination (Admin only)' })
  @ApiResponse({ status: 200, description: 'Paginated list of certificates' })
  getAllCertificates(
    @Query() paginationDto: PaginationDto,
    @Query('search') search?: string,
  ) {
    return this.certificatesService.findAll(paginationDto, search);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('my-certificates')
  @ApiOperation({ summary: 'Get current user certificates' })
  @ApiResponse({ status: 200, description: 'List of user certificates' })
  getMyCertificates(@CurrentUser('id') userId: string) {
    return this.certificatesService.findByUser(userId);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get('event/:eventId')
  @ApiOperation({ summary: 'Get certificates for an event (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of event certificates' })
  getCertificatesByEvent(
    @Param('eventId') eventId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.certificatesService.findByEvent(eventId, paginationDto);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('download/:id')
  @ApiOperation({ summary: 'Download certificate PDF' })
  @ApiResponse({ status: 200, description: 'Certificate PDF file' })
  async downloadCertificate(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    // Admins can download any certificate
    const certificate = await this.certificatesService.findById(id);
    
    if (
      userRole !== UserRole.SUPER_ADMIN &&
      userRole !== UserRole.ADMIN &&
      certificate.user.toString() !== userId
    ) {
      throw new Error('ليس لديك صلاحية تحميل هذه الشهادة');
    }

    const uploadPath = this.configService.get<string>('storage.uploadPath') || './uploads';
    const filePath = path.join(uploadPath, certificate.pdfPath || '');

    if (!fs.existsSync(filePath)) {
      throw new Error('ملف الشهادة غير موجود');
    }

    const file = fs.createReadStream(filePath);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${certificate.serialNumber}.pdf"`,
    });

    return new StreamableFile(file);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Patch(':id/revoke')
  @ApiOperation({ summary: 'Revoke a certificate (Admin only)' })
  @ApiResponse({ status: 200, description: 'Certificate revoked successfully' })
  revokeCertificate(
    @Param('id') id: string,
    @Body() revokeDto: RevokeCertificateDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.certificatesService.revokeCertificate(id, revokeDto, userId);
  }

  // ============= TEMPLATES =============

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Post('templates')
  @ApiOperation({ summary: 'Create certificate template (Admin only)' })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
  createTemplate(@Body() createTemplateDto: CreateTemplateDto) {
    return this.certificatesService.createTemplate(createTemplateDto);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get('templates')
  @ApiOperation({ summary: 'Get all certificate templates (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of templates' })
  getAllTemplates() {
    return this.certificatesService.findAllTemplates();
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Patch('templates/:id')
  @ApiOperation({ summary: 'Update certificate template (Admin only)' })
  @ApiResponse({ status: 200, description: 'Template updated successfully' })
  updateTemplate(
    @Param('id') id: string,
    @Body() updateData: Partial<CreateTemplateDto>,
  ) {
    return this.certificatesService.updateTemplate(id, updateData);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Delete('templates/:id')
  @ApiOperation({ summary: 'Delete certificate template (Admin only)' })
  @ApiResponse({ status: 200, description: 'Template deleted successfully' })
  deleteTemplate(@Param('id') id: string) {
    return this.certificatesService.deleteTemplate(id);
  }
}
