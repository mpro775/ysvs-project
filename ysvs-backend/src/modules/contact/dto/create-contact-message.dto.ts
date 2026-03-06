import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateContactMessageDto {
  @ApiProperty({ example: 'د. أحمد محمد', description: 'Full name' })
  @IsString({ message: 'الاسم يجب أن يكون نصاً' })
  @MinLength(3, { message: 'الاسم يجب أن يكون 3 أحرف على الأقل' })
  @MaxLength(120, { message: 'الاسم طويل جداً' })
  name: string;

  @ApiProperty({ example: 'ahmed@example.com', description: 'Email address' })
  @IsEmail({}, { message: 'البريد الإلكتروني غير صالح' })
  email: string;

  @ApiProperty({ example: 'استفسار عن عضوية الجمعية', description: 'Message subject' })
  @IsString({ message: 'الموضوع يجب أن يكون نصاً' })
  @MinLength(5, { message: 'الموضوع يجب أن يكون 5 أحرف على الأقل' })
  @MaxLength(200, { message: 'الموضوع طويل جداً' })
  subject: string;

  @ApiProperty({
    example: 'أرغب بمعرفة شروط الانتساب إلى الجمعية وآلية التسجيل.',
    description: 'Message body',
  })
  @IsString({ message: 'الرسالة يجب أن تكون نصاً' })
  @MinLength(20, { message: 'الرسالة يجب أن تكون 20 حرفاً على الأقل' })
  @MaxLength(5000, { message: 'الرسالة طويلة جداً' })
  message: string;

  @ApiPropertyOptional({ example: 'contact-page', description: 'Submission source' })
  @IsOptional()
  @IsString({ message: 'مصدر الرسالة يجب أن يكون نصاً' })
  @MaxLength(100, { message: 'مصدر الرسالة طويل جداً' })
  source?: string;

  @ApiPropertyOptional({ example: 'ar', description: 'Preferred locale' })
  @IsOptional()
  @IsString({ message: 'اللغة يجب أن تكون نصاً' })
  @MaxLength(10, { message: 'قيمة اللغة طويلة جداً' })
  locale?: string;

  @ApiPropertyOptional({
    description: 'Spam trap field (must remain empty)',
    example: '',
  })
  @IsOptional()
  @IsEmpty({ message: 'طلب غير صالح' })
  website?: string;
}
