import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateContactReadDto {
  @ApiProperty({
    description: 'Read flag',
    example: true,
  })
  @IsBoolean({ message: 'قيمة القراءة غير صالحة' })
  isRead: boolean;
}
