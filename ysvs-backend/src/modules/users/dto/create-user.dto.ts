import {
  IsEmail,
  IsString,
  IsNotEmpty,
  MinLength,
  IsOptional,
  IsEnum,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../common/decorators/roles.decorator';

export class CreateUserDto {
  @ApiProperty({ example: 'doctor@example.com', description: 'User email address' })
  @IsEmail({}, { message: 'البريد الإلكتروني غير صالح' })
  @IsNotEmpty({ message: 'البريد الإلكتروني مطلوب' })
  email: string;

  @ApiProperty({ example: 'Password123!', description: 'User password (min 8 characters)' })
  @IsString({ message: 'كلمة المرور يجب أن تكون نصاً' })
  @MinLength(8, { message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'كلمة المرور يجب أن تحتوي على حرف كبير وحرف صغير ورقم أو رمز',
  })
  password: string;

  @ApiProperty({ example: 'د. أحمد محمد', description: 'Full name in Arabic' })
  @IsString({ message: 'الاسم بالعربي يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'الاسم بالعربي مطلوب' })
  fullNameAr: string;

  @ApiProperty({ example: 'Dr. Ahmed Mohammed', description: 'Full name in English' })
  @IsString({ message: 'الاسم بالإنجليزي يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'الاسم بالإنجليزي مطلوب' })
  fullNameEn: string;

  @ApiPropertyOptional({ example: '+967777123456', description: 'Phone number' })
  @IsOptional()
  @IsString({ message: 'رقم الهاتف يجب أن يكون نصاً' })
  phone?: string;

  @ApiPropertyOptional({ example: 'جراحة الأوعية الدموية', description: 'Medical specialty' })
  @IsOptional()
  @IsString({ message: 'التخصص يجب أن يكون نصاً' })
  specialty?: string;

  @ApiPropertyOptional({ example: 'مستشفى الثورة العام', description: 'Workplace' })
  @IsOptional()
  @IsString({ message: 'مكان العمل يجب أن يكون نصاً' })
  workplace?: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.MEMBER })
  @IsOptional()
  @IsEnum(UserRole, { message: 'الدور غير صالح' })
  role?: UserRole;
}
