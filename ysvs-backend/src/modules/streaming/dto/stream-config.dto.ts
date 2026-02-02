import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StreamProvider } from '../schemas/stream-config.schema';

export class CreateStreamConfigDto {
  @ApiProperty({ enum: StreamProvider, default: StreamProvider.YOUTUBE })
  @IsEnum(StreamProvider, { message: 'مزود البث غير صالح' })
  provider: StreamProvider;

  @ApiProperty({ example: 'https://www.youtube.com/embed/VIDEO_ID', description: 'Embed URL' })
  @IsString({ message: 'رابط البث يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'رابط البث مطلوب' })
  embedUrl: string;

  @ApiPropertyOptional({ example: 'بث مباشر - المؤتمر السنوي', description: 'Title in Arabic' })
  @IsOptional()
  @IsString()
  titleAr?: string;

  @ApiPropertyOptional({ example: 'Live Stream - Annual Conference', description: 'Title in English' })
  @IsOptional()
  @IsString()
  titleEn?: string;

  @ApiPropertyOptional({ description: 'Description in Arabic' })
  @IsOptional()
  @IsString()
  descriptionAr?: string;

  @ApiPropertyOptional({ description: 'Description in English' })
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiPropertyOptional({ description: 'Associated event ID' })
  @IsOptional()
  @IsMongoId({ message: 'معرف المؤتمر غير صالح' })
  event?: string;
}

export class UpdateStreamConfigDto {
  @ApiPropertyOptional({ enum: StreamProvider })
  @IsOptional()
  @IsEnum(StreamProvider, { message: 'مزود البث غير صالح' })
  provider?: StreamProvider;

  @ApiPropertyOptional({ description: 'Embed URL' })
  @IsOptional()
  @IsString()
  embedUrl?: string;

  @ApiPropertyOptional({ description: 'Title in Arabic' })
  @IsOptional()
  @IsString()
  titleAr?: string;

  @ApiPropertyOptional({ description: 'Title in English' })
  @IsOptional()
  @IsString()
  titleEn?: string;

  @ApiPropertyOptional({ description: 'Description in Arabic' })
  @IsOptional()
  @IsString()
  descriptionAr?: string;

  @ApiPropertyOptional({ description: 'Description in English' })
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiPropertyOptional({ description: 'Associated event ID' })
  @IsOptional()
  @IsMongoId()
  event?: string;
}

export class StartStreamDto {
  @ApiPropertyOptional({ description: 'Stream config ID (creates new if not provided)' })
  @IsOptional()
  @IsMongoId({ message: 'معرف إعدادات البث غير صالح' })
  configId?: string;
}
