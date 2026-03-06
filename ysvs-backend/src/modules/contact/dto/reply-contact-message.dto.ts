import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ReplyContactMessageDto {
  @ApiProperty({
    description: 'Reply body',
    example: 'شكراً لتواصلكم، تم استلام طلبكم وسيتم مراجعة البيانات خلال 24 ساعة.',
  })
  @IsString({ message: 'نص الرد يجب أن يكون نصاً' })
  @MinLength(5, { message: 'نص الرد قصير جداً' })
  @MaxLength(5000, { message: 'نص الرد طويل جداً' })
  body: string;

  @ApiPropertyOptional({
    description: 'Email subject override',
    example: 'رد بخصوص استفساركم',
  })
  @IsOptional()
  @IsString({ message: 'عنوان الرد يجب أن يكون نصاً' })
  @MaxLength(200, { message: 'عنوان الرد طويل جداً' })
  subject?: string;
}
