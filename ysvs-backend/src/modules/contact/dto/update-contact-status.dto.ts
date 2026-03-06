import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ContactMessageStatus } from '../schemas/contact-message.schema';

export class UpdateContactStatusDto {
  @ApiProperty({
    description: 'Message status',
    enum: ContactMessageStatus,
    example: ContactMessageStatus.IN_PROGRESS,
  })
  @IsEnum(ContactMessageStatus, { message: 'حالة الرسالة غير صالحة' })
  status: ContactMessageStatus;

  @ApiProperty({
    description: 'Optional assignee identifier (email or user id)',
    example: 'admin@ysvs.org',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'المكلّف يجب أن يكون نصاً' })
  @MaxLength(120, { message: 'قيمة المكلّف طويلة جداً' })
  assignedTo?: string;
}
