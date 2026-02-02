import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCertificateDto {
  @ApiProperty({ description: 'Registration ID' })
  @IsMongoId({ message: 'معرف التسجيل غير صالح' })
  @IsNotEmpty({ message: 'معرف التسجيل مطلوب' })
  registrationId: string;

  @ApiPropertyOptional({ description: 'Template ID (uses default if not provided)' })
  @IsOptional()
  @IsMongoId({ message: 'معرف القالب غير صالح' })
  templateId?: string;
}

export class BulkGenerateCertificatesDto {
  @ApiProperty({ description: 'Event ID' })
  @IsMongoId({ message: 'معرف المؤتمر غير صالح' })
  @IsNotEmpty({ message: 'معرف المؤتمر مطلوب' })
  eventId: string;

  @ApiPropertyOptional({ description: 'Template ID (uses default if not provided)' })
  @IsOptional()
  @IsMongoId({ message: 'معرف القالب غير صالح' })
  templateId?: string;
}

export class RevokeCertificateDto {
  @ApiProperty({ description: 'Reason for revoking the certificate' })
  @IsString({ message: 'سبب الإلغاء يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'سبب الإلغاء مطلوب' })
  reason: string;
}
