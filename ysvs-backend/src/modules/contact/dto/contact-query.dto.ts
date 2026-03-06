import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { ContactMessageStatus } from '../schemas/contact-message.schema';

export class ContactQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by message status',
    enum: ContactMessageStatus,
  })
  @IsOptional()
  @IsEnum(ContactMessageStatus, { message: 'حالة الرسالة غير صالحة' })
  status?: ContactMessageStatus;

  @ApiPropertyOptional({
    description: 'Filter by read state',
    example: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'قيمة القراءة غير صالحة' })
  isRead?: boolean;

  @ApiPropertyOptional({
    description: 'Search in name, email, subject, and message',
    example: 'عضوية',
  })
  @IsOptional()
  @IsString({ message: 'نص البحث يجب أن يكون نصاً' })
  search?: string;
}
