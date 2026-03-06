import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class SubscribeNewsletterDto {
  @ApiProperty({
    example: 'subscriber@example.com',
    description: 'Subscriber email address',
  })
  @IsEmail({}, { message: 'البريد الإلكتروني غير صالح' })
  email: string;

  @ApiPropertyOptional({
    example: 'homepage',
    description: 'Subscription source (homepage, footer, etc.)',
  })
  @IsOptional()
  @IsString({ message: 'مصدر الاشتراك يجب أن يكون نصاً' })
  @MaxLength(100, { message: 'مصدر الاشتراك طويل جداً' })
  source?: string;

  @ApiPropertyOptional({
    example: 'ar',
    description: 'Preferred locale',
  })
  @IsOptional()
  @IsString({ message: 'اللغة يجب أن تكون نصاً' })
  @MaxLength(10, { message: 'قيمة اللغة طويلة جداً' })
  locale?: string;
}
