import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { ProfessionalVerificationStatus } from '../schemas/user.schema';

export class ProfessionalVerificationQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: ProfessionalVerificationStatus })
  @IsOptional()
  @IsEnum(ProfessionalVerificationStatus, { message: 'حالة التوثيق غير صالحة' })
  status?: ProfessionalVerificationStatus;

  @ApiPropertyOptional({ description: 'Search by name or email' })
  @IsOptional()
  @IsString({ message: 'البحث يجب أن يكون نصا' })
  search?: string;
}
