import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum MediaType {
  IMAGE = 'image',
  DOCUMENT = 'document',
  VIDEO = 'video',
}

export class UploadFileDto {
  @ApiPropertyOptional({ enum: MediaType, default: MediaType.IMAGE })
  @IsOptional()
  @IsEnum(MediaType, { message: 'نوع الملف غير صالح' })
  type?: MediaType;

  @ApiPropertyOptional({ description: 'Custom folder path' })
  @IsOptional()
  @IsString({ message: 'مسار المجلد يجب أن يكون نصاً' })
  folder?: string;

  @ApiPropertyOptional({ description: 'Alt text for images' })
  @IsOptional()
  @IsString({ message: 'النص البديل يجب أن يكون نصاً' })
  alt?: string;
}
