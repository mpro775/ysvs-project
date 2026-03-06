import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateAboutObjectiveDto {
  @ApiProperty({ example: 'تنظيم المؤتمرات والندوات العلمية المتخصصة' })
  @IsString({ message: 'نص الهدف بالعربية يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'نص الهدف بالعربية مطلوب' })
  @MaxLength(300, { message: 'نص الهدف بالعربية طويل جداً' })
  textAr: string;

  @ApiProperty({ example: 'Organize specialized scientific conferences and seminars' })
  @IsString({ message: 'نص الهدف بالإنجليزية يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'نص الهدف بالإنجليزية مطلوب' })
  @MaxLength(300, { message: 'نص الهدف بالإنجليزية طويل جداً' })
  textEn: string;

  @ApiPropertyOptional({ default: 0, description: 'Display order' })
  @IsOptional()
  @IsInt({ message: 'ترتيب الهدف يجب أن يكون رقماً صحيحاً' })
  @Min(0, { message: 'ترتيب الهدف يجب أن يكون أكبر من أو يساوي صفر' })
  order?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean({ message: 'حالة تفعيل الهدف يجب أن تكون قيمة منطقية' })
  isActive?: boolean;
}

export class CreateAboutContentDto {
  @ApiProperty({ example: 'عن الجمعية' })
  @IsString({ message: 'عنوان القسم بالعربية يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'عنوان القسم بالعربية مطلوب' })
  @MaxLength(120, { message: 'عنوان القسم بالعربية طويل جداً' })
  heroTitleAr: string;

  @ApiProperty({ example: 'About The Society' })
  @IsString({ message: 'عنوان القسم بالإنجليزية يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'عنوان القسم بالإنجليزية مطلوب' })
  @MaxLength(120, { message: 'عنوان القسم بالإنجليزية طويل جداً' })
  heroTitleEn: string;

  @ApiProperty({
    example:
      'الجمعية اليمنية لجراحة الأوعية الدموية هي جمعية طبية متخصصة تأسست بهدف تطوير وتعزيز مجال جراحة الأوعية الدموية في اليمن',
  })
  @IsString({ message: 'وصف القسم بالعربية يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'وصف القسم بالعربية مطلوب' })
  @MaxLength(1000, { message: 'وصف القسم بالعربية طويل جداً' })
  heroDescriptionAr: string;

  @ApiProperty({
    example:
      'The Yemeni Society for Vascular Surgery is a specialized medical society founded to advance vascular surgery in Yemen.',
  })
  @IsString({ message: 'وصف القسم بالإنجليزية يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'وصف القسم بالإنجليزية مطلوب' })
  @MaxLength(1000, { message: 'وصف القسم بالإنجليزية طويل جداً' })
  heroDescriptionEn: string;

  @ApiProperty({ example: 'رؤيتنا' })
  @IsString({ message: 'عنوان الرؤية بالعربية يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'عنوان الرؤية بالعربية مطلوب' })
  @MaxLength(120, { message: 'عنوان الرؤية بالعربية طويل جداً' })
  visionTitleAr: string;

  @ApiProperty({ example: 'Our Vision' })
  @IsString({ message: 'عنوان الرؤية بالإنجليزية يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'عنوان الرؤية بالإنجليزية مطلوب' })
  @MaxLength(120, { message: 'عنوان الرؤية بالإنجليزية طويل جداً' })
  visionTitleEn: string;

  @ApiProperty({
    example:
      'أن نكون الجمعية الرائدة في مجال جراحة الأوعية الدموية على مستوى المنطقة، ونساهم في تقديم أفضل رعاية صحية للمرضى من خلال التعليم المستمر والبحث العلمي.',
  })
  @IsString({ message: 'نص الرؤية بالعربية يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'نص الرؤية بالعربية مطلوب' })
  @MaxLength(2000, { message: 'نص الرؤية بالعربية طويل جداً' })
  visionTextAr: string;

  @ApiProperty({
    example:
      'To be the leading society in vascular surgery in the region and contribute to better patient care through continuous education and scientific research.',
  })
  @IsString({ message: 'نص الرؤية بالإنجليزية يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'نص الرؤية بالإنجليزية مطلوب' })
  @MaxLength(2000, { message: 'نص الرؤية بالإنجليزية طويل جداً' })
  visionTextEn: string;

  @ApiProperty({ example: 'رسالتنا' })
  @IsString({ message: 'عنوان الرسالة بالعربية يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'عنوان الرسالة بالعربية مطلوب' })
  @MaxLength(120, { message: 'عنوان الرسالة بالعربية طويل جداً' })
  missionTitleAr: string;

  @ApiProperty({ example: 'Our Mission' })
  @IsString({ message: 'عنوان الرسالة بالإنجليزية يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'عنوان الرسالة بالإنجليزية مطلوب' })
  @MaxLength(120, { message: 'عنوان الرسالة بالإنجليزية طويل جداً' })
  missionTitleEn: string;

  @ApiProperty({
    example:
      'تطوير مهارات ومعارف الأطباء في مجال جراحة الأوعية الدموية من خلال تنظيم المؤتمرات والورش العلمية، وتبادل الخبرات مع الجمعيات الدولية.',
  })
  @IsString({ message: 'نص الرسالة بالعربية يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'نص الرسالة بالعربية مطلوب' })
  @MaxLength(2000, { message: 'نص الرسالة بالعربية طويل جداً' })
  missionTextAr: string;

  @ApiProperty({
    example:
      'Develop physicians skills and knowledge in vascular surgery through conferences, workshops, and knowledge exchange with international societies.',
  })
  @IsString({ message: 'نص الرسالة بالإنجليزية يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'نص الرسالة بالإنجليزية مطلوب' })
  @MaxLength(2000, { message: 'نص الرسالة بالإنجليزية طويل جداً' })
  missionTextEn: string;

  @ApiPropertyOptional({ type: [CreateAboutObjectiveDto], description: 'About page objectives' })
  @IsOptional()
  @IsArray({ message: 'الأهداف يجب أن تكون مصفوفة' })
  @ValidateNested({ each: true })
  @Type(() => CreateAboutObjectiveDto)
  objectives?: CreateAboutObjectiveDto[];
}
