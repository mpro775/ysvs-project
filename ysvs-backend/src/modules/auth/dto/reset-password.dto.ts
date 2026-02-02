import { IsString, IsNotEmpty, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Password reset token' })
  @IsString({ message: 'رمز إعادة التعيين يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'رمز إعادة التعيين مطلوب' })
  token: string;

  @ApiProperty({ example: 'NewPassword123!', description: 'New password' })
  @IsString({ message: 'كلمة المرور يجب أن تكون نصاً' })
  @MinLength(8, { message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'كلمة المرور يجب أن تحتوي على حرف كبير وحرف صغير ورقم أو رمز',
  })
  newPassword: string;
}
