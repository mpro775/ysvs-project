import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsDate,
  IsMongoId,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTicketTypeDto {
  @ApiProperty({ example: 'تذكرة طبيب', description: 'Ticket name in Arabic' })
  @IsString({ message: 'اسم التذكرة بالعربي يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'اسم التذكرة بالعربي مطلوب' })
  nameAr: string;

  @ApiProperty({ example: 'Doctor Ticket', description: 'Ticket name in English' })
  @IsString({ message: 'اسم التذكرة بالإنجليزي يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'اسم التذكرة بالإنجليزي مطلوب' })
  nameEn: string;

  @ApiPropertyOptional({ description: 'Description in Arabic' })
  @IsOptional()
  @IsString()
  descriptionAr?: string;

  @ApiPropertyOptional({ description: 'Description in English' })
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiProperty({ example: 50000, description: 'Ticket price' })
  @IsNumber({}, { message: 'السعر يجب أن يكون رقماً' })
  @Min(0, { message: 'السعر لا يمكن أن يكون سالباً' })
  price: number;

  @ApiPropertyOptional({ example: 'YER', default: 'YER' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 100, description: 'Maximum quantity (0 = unlimited)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxQuantity?: number;

  @ApiProperty({ description: 'Event ID' })
  @IsMongoId({ message: 'معرف المؤتمر غير صالح' })
  @IsNotEmpty({ message: 'معرف المؤتمر مطلوب' })
  event: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Sale start date' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  saleStartDate?: Date;

  @ApiPropertyOptional({ description: 'Sale end date' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  saleEndDate?: Date;
}
