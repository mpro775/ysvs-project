import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsDate,
  IsNumber,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventStatus } from '../schemas/event.schema';

class LocationDto {
  @ApiProperty({ example: 'فندق موفنبيك' })
  @IsString()
  @IsNotEmpty()
  venue: string;

  @ApiPropertyOptional({ example: 'Movenpick Hotel' })
  @IsOptional()
  @IsString()
  venueEn?: string;

  @ApiProperty({ example: 'شارع الزبيري' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiPropertyOptional({ example: 'Al-Zubairi Street' })
  @IsOptional()
  @IsString()
  addressEn?: string;

  @ApiProperty({ example: 'صنعاء' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiPropertyOptional({ example: "Sana'a" })
  @IsOptional()
  @IsString()
  cityEn?: string;
}

export class CreateEventDto {
  @ApiProperty({ example: 'المؤتمر السنوي الخامس', description: 'Title in Arabic' })
  @IsString({ message: 'العنوان بالعربي يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'العنوان بالعربي مطلوب' })
  titleAr: string;

  @ApiProperty({ example: 'Fifth Annual Conference', description: 'Title in English' })
  @IsString({ message: 'العنوان بالإنجليزي يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'العنوان بالإنجليزي مطلوب' })
  titleEn: string;

  @ApiProperty({ example: 'fifth-annual-conference', description: 'URL slug' })
  @IsString({ message: 'الرابط المختصر يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'الرابط المختصر مطلوب' })
  slug: string;

  @ApiPropertyOptional({ description: 'Description in Arabic' })
  @IsOptional()
  @IsString()
  descriptionAr?: string;

  @ApiPropertyOptional({ description: 'Description in English' })
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiPropertyOptional({ description: 'Cover image URL' })
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiProperty({ example: '2026-03-15T09:00:00.000Z', description: 'Start date and time' })
  @IsDate({ message: 'تاريخ البداية غير صالح' })
  @Type(() => Date)
  startDate: Date;

  @ApiProperty({ example: '2026-03-17T18:00:00.000Z', description: 'End date and time' })
  @IsDate({ message: 'تاريخ النهاية غير صالح' })
  @Type(() => Date)
  endDate: Date;

  @ApiPropertyOptional({ type: LocationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;

  @ApiPropertyOptional({ enum: EventStatus, default: EventStatus.UPCOMING })
  @IsOptional()
  @IsEnum(EventStatus, { message: 'حالة المؤتمر غير صالحة' })
  status?: EventStatus;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  registrationOpen?: boolean;

  @ApiPropertyOptional({ description: 'Registration deadline' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  registrationDeadline?: Date;

  @ApiPropertyOptional({ default: 0, description: 'Maximum attendees (0 = unlimited)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxAttendees?: number;

  @ApiPropertyOptional({ default: 0, description: 'CME credit hours' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cmeHours?: number;
}
