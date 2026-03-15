import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Gender } from '../../users/schemas/user.schema';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'د. أحمد محمد', description: 'Full name in Arabic' })
  @IsOptional()
  @IsString({ message: 'الاسم بالعربي يجب أن يكون نصاً' })
  fullNameAr?: string;

  @ApiPropertyOptional({ example: 'Dr. Ahmed Mohammed', description: 'Full name in English' })
  @IsOptional()
  @IsString({ message: 'الاسم بالإنجليزي يجب أن يكون نصاً' })
  fullNameEn?: string;

  @ApiPropertyOptional({ example: '+967777123456', description: 'Phone number' })
  @IsOptional()
  @IsString({ message: 'رقم الهاتف يجب أن يكون نصاً' })
  phone?: string;

  @ApiPropertyOptional({ enum: Gender, example: Gender.MALE, description: 'Gender' })
  @IsOptional()
  @IsEnum(Gender, { message: 'الجنس غير صالح' })
  gender?: Gender;

  @ApiPropertyOptional({ example: 'اليمن', description: 'Country' })
  @IsOptional()
  @IsString({ message: 'الدولة يجب أن تكون نصاً' })
  country?: string;

  @ApiPropertyOptional({ example: 'استشاري', description: 'Job title' })
  @IsOptional()
  @IsString({ message: 'الصفة الوظيفية يجب أن تكون نصاً' })
  jobTitle?: string;

  @ApiPropertyOptional({ example: 'جراحة الأوعية الدموية', description: 'Specialty' })
  @IsOptional()
  @IsString({ message: 'التخصص يجب أن يكون نصاً' })
  specialty?: string;

  @ApiPropertyOptional({ example: 'مستشفى الثورة العام', description: 'Workplace' })
  @IsOptional()
  @IsString({ message: 'جهة العمل يجب أن تكون نصاً' })
  workplace?: string;
}
