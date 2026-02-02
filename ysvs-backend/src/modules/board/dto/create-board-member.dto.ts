import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBoardMemberDto {
  @ApiProperty({ example: 'د. أحمد محمد علي', description: 'Name in Arabic' })
  @IsString({ message: 'الاسم بالعربي يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'الاسم بالعربي مطلوب' })
  nameAr: string;

  @ApiProperty({ example: 'Dr. Ahmed Mohammed Ali', description: 'Name in English' })
  @IsString({ message: 'الاسم بالإنجليزي يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'الاسم بالإنجليزي مطلوب' })
  nameEn: string;

  @ApiProperty({ example: 'رئيس مجلس الإدارة', description: 'Position in Arabic' })
  @IsString({ message: 'المنصب بالعربي يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'المنصب بالعربي مطلوب' })
  positionAr: string;

  @ApiProperty({ example: 'Chairman of the Board', description: 'Position in English' })
  @IsString({ message: 'المنصب بالإنجليزي يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'المنصب بالإنجليزي مطلوب' })
  positionEn: string;

  @ApiPropertyOptional({ description: 'Biography in Arabic' })
  @IsOptional()
  @IsString({ message: 'السيرة الذاتية بالعربي يجب أن تكون نصاً' })
  bioAr?: string;

  @ApiPropertyOptional({ description: 'Biography in English' })
  @IsOptional()
  @IsString({ message: 'السيرة الذاتية بالإنجليزي يجب أن تكون نصاً' })
  bioEn?: string;

  @ApiPropertyOptional({ description: 'Profile image URL' })
  @IsOptional()
  @IsString({ message: 'رابط الصورة يجب أن يكون نصاً' })
  image?: string;

  @ApiPropertyOptional({ example: 'member@ysvs.org', description: 'Email address' })
  @IsOptional()
  @IsEmail({}, { message: 'البريد الإلكتروني غير صالح' })
  email?: string;

  @ApiPropertyOptional({ example: '+967777123456', description: 'Phone number' })
  @IsOptional()
  @IsString({ message: 'رقم الهاتف يجب أن يكون نصاً' })
  phone?: string;

  @ApiPropertyOptional({ default: 0, description: 'Display order' })
  @IsOptional()
  @IsNumber({}, { message: 'الترتيب يجب أن يكون رقماً' })
  order?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean({ message: 'حالة التفعيل يجب أن تكون قيمة منطقية' })
  isActive?: boolean;
}
