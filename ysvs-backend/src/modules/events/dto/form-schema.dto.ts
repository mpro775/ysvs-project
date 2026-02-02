import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FormFieldType } from '../schemas/event.schema';

class FormFieldOptionDto {
  @ApiProperty({ example: 'vascular', description: 'Option value' })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiProperty({ example: 'جراحة الأوعية الدموية', description: 'Option label in Arabic' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiPropertyOptional({ example: 'Vascular Surgery', description: 'Option label in English' })
  @IsOptional()
  @IsString()
  labelEn?: string;
}

class FormFieldValidationDto {
  @ApiPropertyOptional({ example: 3, description: 'Minimum length' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minLength?: number;

  @ApiPropertyOptional({ example: 100, description: 'Maximum length' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxLength?: number;

  @ApiPropertyOptional({ example: 0, description: 'Minimum value (for numbers)' })
  @IsOptional()
  @IsNumber()
  min?: number;

  @ApiPropertyOptional({ example: 100, description: 'Maximum value (for numbers)' })
  @IsOptional()
  @IsNumber()
  max?: number;

  @ApiPropertyOptional({ example: '^[0-9]+$', description: 'Regex pattern' })
  @IsOptional()
  @IsString()
  pattern?: string;

  @ApiPropertyOptional({ example: ['pdf', 'doc', 'docx'], description: 'Allowed file types' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fileTypes?: string[];

  @ApiPropertyOptional({ example: 5242880, description: 'Max file size in bytes' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxFileSize?: number;
}

export class FormFieldDto {
  @ApiProperty({ example: 'specialty', description: 'Unique field ID' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ enum: FormFieldType, example: FormFieldType.SELECT })
  @IsEnum(FormFieldType, { message: 'نوع الحقل غير صالح' })
  type: FormFieldType;

  @ApiProperty({ example: 'التخصص', description: 'Field label in Arabic' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ example: 'Specialty', description: 'Field label in English' })
  @IsString()
  @IsNotEmpty()
  labelEn: string;

  @ApiPropertyOptional({ example: 'اختر تخصصك', description: 'Placeholder in Arabic' })
  @IsOptional()
  @IsString()
  placeholder?: string;

  @ApiPropertyOptional({ example: 'Select your specialty', description: 'Placeholder in English' })
  @IsOptional()
  @IsString()
  placeholderEn?: string;

  @ApiProperty({ example: true, description: 'Is field required' })
  @IsBoolean()
  required: boolean;

  @ApiPropertyOptional({ type: [FormFieldOptionDto], description: 'Options for select/radio/checkbox' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FormFieldOptionDto)
  options?: FormFieldOptionDto[];

  @ApiPropertyOptional({ type: FormFieldValidationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FormFieldValidationDto)
  validation?: FormFieldValidationDto;

  @ApiProperty({ example: 1, description: 'Display order' })
  @IsNumber()
  @Min(0)
  order: number;
}

export class UpdateFormSchemaDto {
  @ApiProperty({ type: [FormFieldDto], description: 'Form fields array' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FormFieldDto)
  formSchema: FormFieldDto[];
}
