import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEnum,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class PositionConfigDto {
  @ApiProperty({ example: 400 })
  @IsNumber()
  x: number;

  @ApiProperty({ example: 300 })
  @IsNumber()
  y: number;

  @ApiPropertyOptional({ example: 24 })
  @IsOptional()
  @IsNumber()
  fontSize?: number;

  @ApiPropertyOptional({ example: '#000000' })
  @IsOptional()
  @IsString()
  fontColor?: string;

  @ApiPropertyOptional({ enum: ['left', 'center', 'right'] })
  @IsOptional()
  @IsEnum(['left', 'center', 'right'])
  align?: 'left' | 'center' | 'right';
}

class TemplateLayoutDto {
  @ApiProperty({ type: PositionConfigDto })
  @ValidateNested()
  @Type(() => PositionConfigDto)
  namePosition: PositionConfigDto;

  @ApiProperty({ type: PositionConfigDto })
  @ValidateNested()
  @Type(() => PositionConfigDto)
  eventPosition: PositionConfigDto;

  @ApiProperty({ type: PositionConfigDto })
  @ValidateNested()
  @Type(() => PositionConfigDto)
  datePosition: PositionConfigDto;

  @ApiProperty({ type: PositionConfigDto })
  @ValidateNested()
  @Type(() => PositionConfigDto)
  qrPosition: PositionConfigDto;

  @ApiProperty({ type: PositionConfigDto })
  @ValidateNested()
  @Type(() => PositionConfigDto)
  serialPosition: PositionConfigDto;

  @ApiPropertyOptional({ type: PositionConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PositionConfigDto)
  cmeHoursPosition?: PositionConfigDto;
}

class TemplateFontsDto {
  @ApiPropertyOptional({ example: 'Helvetica-Bold' })
  @IsOptional()
  @IsString()
  nameFont?: string;

  @ApiPropertyOptional({ example: 28 })
  @IsOptional()
  @IsNumber()
  nameFontSize?: number;

  @ApiPropertyOptional({ example: 'Helvetica' })
  @IsOptional()
  @IsString()
  eventFont?: string;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumber()
  eventFontSize?: number;

  @ApiPropertyOptional({ example: 'Helvetica' })
  @IsOptional()
  @IsString()
  defaultFont?: string;

  @ApiPropertyOptional({ example: 14 })
  @IsOptional()
  @IsNumber()
  defaultFontSize?: number;
}

export class CreateTemplateDto {
  @ApiProperty({ example: 'قالب الشهادة الرسمي', description: 'Template name' })
  @IsString({ message: 'اسم القالب يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'اسم القالب مطلوب' })
  name: string;

  @ApiPropertyOptional({ description: 'Template description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Background image URL' })
  @IsString({ message: 'صورة الخلفية يجب أن تكون رابطاً' })
  @IsNotEmpty({ message: 'صورة الخلفية مطلوبة' })
  backgroundImage: string;

  @ApiProperty({ type: TemplateLayoutDto })
  @ValidateNested()
  @Type(() => TemplateLayoutDto)
  layout: TemplateLayoutDto;

  @ApiPropertyOptional({ type: TemplateFontsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => TemplateFontsDto)
  fonts?: TemplateFontsDto;

  @ApiPropertyOptional({ example: 'A4', default: 'A4' })
  @IsOptional()
  @IsString()
  pageSize?: string;

  @ApiPropertyOptional({ enum: ['portrait', 'landscape'], default: 'landscape' })
  @IsOptional()
  @IsEnum(['portrait', 'landscape'])
  orientation?: 'portrait' | 'landscape';

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
