import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'أخبار الجمعية', description: 'Category name in Arabic' })
  @IsString({ message: 'اسم التصنيف بالعربي يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'اسم التصنيف بالعربي مطلوب' })
  nameAr: string;

  @ApiProperty({ example: 'Society News', description: 'Category name in English' })
  @IsString({ message: 'اسم التصنيف بالإنجليزي يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'اسم التصنيف بالإنجليزي مطلوب' })
  nameEn: string;

  @ApiProperty({ example: 'society-news', description: 'URL-friendly slug' })
  @IsString({ message: 'الرابط المختصر يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'الرابط المختصر مطلوب' })
  slug: string;

  @ApiPropertyOptional({ description: 'Description in Arabic' })
  @IsOptional()
  @IsString({ message: 'الوصف بالعربي يجب أن يكون نصاً' })
  descriptionAr?: string;

  @ApiPropertyOptional({ description: 'Description in English' })
  @IsOptional()
  @IsString({ message: 'الوصف بالإنجليزي يجب أن يكون نصاً' })
  descriptionEn?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean({ message: 'حالة التفعيل يجب أن تكون قيمة منطقية' })
  isActive?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber({}, { message: 'الترتيب يجب أن يكون رقماً' })
  order?: number;
}
