import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class UnsubscribeNewsletterDto {
  @ApiProperty({
    example: 'subscriber@example.com',
    description: 'Subscriber email address',
  })
  @IsEmail({}, { message: 'البريد الإلكتروني غير صالح' })
  email: string;
}
