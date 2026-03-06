import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { NewsletterSubscriberStatus } from '../schemas/newsletter-subscriber.schema';

export class UpdateSubscriberStatusDto {
  @ApiProperty({
    enum: NewsletterSubscriberStatus,
    description: 'Target subscriber status',
  })
  @IsEnum(NewsletterSubscriberStatus, { message: 'حالة الاشتراك غير صالحة' })
  status: NewsletterSubscriberStatus;
}
