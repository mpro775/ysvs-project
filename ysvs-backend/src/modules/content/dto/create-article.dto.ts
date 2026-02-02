import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  IsMongoId,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArticleStatus } from '../schemas/article.schema';

export class CreateArticleDto {
  @ApiProperty({ example: 'مؤتمر الجمعية السنوي الخامس', description: 'Title in Arabic' })
  @IsString({ message: 'العنوان بالعربي يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'العنوان بالعربي مطلوب' })
  titleAr: string;

  @ApiProperty({ example: 'Fifth Annual Society Conference', description: 'Title in English' })
  @IsString({ message: 'العنوان بالإنجليزي يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'العنوان بالإنجليزي مطلوب' })
  titleEn: string;

  @ApiProperty({ example: 'fifth-annual-conference', description: 'URL-friendly slug' })
  @IsString({ message: 'الرابط المختصر يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'الرابط المختصر مطلوب' })
  slug: string;

  @ApiPropertyOptional({ description: 'Short excerpt in Arabic' })
  @IsOptional()
  @IsString({ message: 'الملخص بالعربي يجب أن يكون نصاً' })
  excerptAr?: string;

  @ApiPropertyOptional({ description: 'Short excerpt in English' })
  @IsOptional()
  @IsString({ message: 'الملخص بالإنجليزي يجب أن يكون نصاً' })
  excerptEn?: string;

  @ApiProperty({ description: 'Full content in Arabic (HTML)' })
  @IsString({ message: 'المحتوى بالعربي يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'المحتوى بالعربي مطلوب' })
  contentAr: string;

  @ApiProperty({ description: 'Full content in English (HTML)' })
  @IsString({ message: 'المحتوى بالإنجليزي يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'المحتوى بالإنجليزي مطلوب' })
  contentEn: string;

  @ApiPropertyOptional({ description: 'Cover image URL' })
  @IsOptional()
  @IsString({ message: 'صورة الغلاف يجب أن تكون رابطاً' })
  coverImage?: string;

  @ApiPropertyOptional({ description: 'Category ID' })
  @IsOptional()
  @IsMongoId({ message: 'معرف التصنيف غير صالح' })
  category?: string;

  @ApiPropertyOptional({ type: [String], description: 'Tags array' })
  @IsOptional()
  @IsArray({ message: 'الوسوم يجب أن تكون مصفوفة' })
  @IsString({ each: true, message: 'كل وسم يجب أن يكون نصاً' })
  tags?: string[];

  @ApiPropertyOptional({ enum: ArticleStatus, default: ArticleStatus.DRAFT })
  @IsOptional()
  @IsEnum(ArticleStatus, { message: 'حالة المقال غير صالحة' })
  status?: ArticleStatus;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean({ message: 'حالة المقال المميز يجب أن تكون قيمة منطقية' })
  isFeatured?: boolean;
}
