import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ProfessionalVerificationReviewDto {
  @ApiProperty({ enum: ['approved', 'rejected'] })
  @IsIn(['approved', 'rejected'], {
    message: 'قرار المراجعة يجب أن يكون approved أو rejected',
  })
  decision: 'approved' | 'rejected';

  @ApiPropertyOptional({
    description: 'سبب الرفض (مطلوب عند قرار rejected)',
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'سبب الرفض يجب أن يكون نصا' })
  @MinLength(5, { message: 'سبب الرفض يجب أن لا يقل عن 5 أحرف' })
  @MaxLength(500, { message: 'سبب الرفض يجب أن لا يزيد عن 500 حرف' })
  rejectionReason?: string;
}
