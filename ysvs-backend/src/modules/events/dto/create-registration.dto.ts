import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsMongoId,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRegistrationDto {
  @ApiPropertyOptional({ description: 'Ticket type ID' })
  @IsOptional()
  @IsMongoId({ message: 'معرف نوع التذكرة غير صالح' })
  ticketType?: string;

  @ApiProperty({
    description: 'Dynamic form data based on event form schema',
    example: { specialty: 'vascular', experience: '5', hospital: 'Al-Thawra Hospital' },
  })
  @IsObject({ message: 'بيانات النموذج يجب أن تكون كائناً' })
  formData: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
