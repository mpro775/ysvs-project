import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { NewsletterSubscriberStatus } from '../schemas/newsletter-subscriber.schema';

export class NewsletterQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by subscriber status',
    enum: NewsletterSubscriberStatus,
  })
  @IsOptional()
  @IsEnum(NewsletterSubscriberStatus, { message: 'حالة الاشتراك غير صالحة' })
  status?: NewsletterSubscriberStatus;

  @ApiPropertyOptional({
    description: 'Search by email',
    example: 'example.com',
  })
  @IsOptional()
  @IsString({ message: 'نص البحث يجب أن يكون نصاً' })
  search?: string;
}
