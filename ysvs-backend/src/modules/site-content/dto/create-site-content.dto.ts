import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const FOOTER_HREF_REGEX = /^(\/|https?:\/\/).+/;

export class CreateFooterQuickLinkDto {
  @ApiProperty({ example: 'عن الجمعية' })
  @IsString({ message: 'اسم الرابط بالعربية يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'اسم الرابط بالعربية مطلوب' })
  @MaxLength(120, { message: 'اسم الرابط بالعربية طويل جداً' })
  labelAr: string;

  @ApiProperty({ example: 'About' })
  @IsString({ message: 'اسم الرابط بالإنجليزية يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'اسم الرابط بالإنجليزية مطلوب' })
  @MaxLength(120, { message: 'اسم الرابط بالإنجليزية طويل جداً' })
  labelEn: string;

  @ApiProperty({ example: '/about' })
  @IsString({ message: 'رابط التوجيه يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'رابط التوجيه مطلوب' })
  @Matches(FOOTER_HREF_REGEX, {
    message: 'رابط التوجيه يجب أن يبدأ بـ / أو http/https',
  })
  @MaxLength(400, { message: 'رابط التوجيه طويل جداً' })
  href: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt({ message: 'ترتيب الرابط يجب أن يكون رقماً صحيحاً' })
  @Min(0, { message: 'ترتيب الرابط يجب أن يكون أكبر من أو يساوي صفر' })
  order?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean({ message: 'حالة التفعيل يجب أن تكون قيمة منطقية' })
  isActive?: boolean;
}

export class CreateFooterSocialLinkDto {
  @ApiProperty({ example: 'facebook' })
  @IsString({ message: 'اسم المنصة يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'اسم المنصة مطلوب' })
  @MaxLength(60, { message: 'اسم المنصة طويل جداً' })
  platform: string;

  @ApiProperty({ example: 'https://facebook.com/ysvs' })
  @IsString({ message: 'رابط المنصة يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'رابط المنصة مطلوب' })
  @IsUrl(
    { require_protocol: true },
    { message: 'رابط المنصة غير صالح ويجب أن يبدأ بـ http/https' },
  )
  @MaxLength(400, { message: 'رابط المنصة طويل جداً' })
  url: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt({ message: 'ترتيب المنصة يجب أن يكون رقماً صحيحاً' })
  @Min(0, { message: 'ترتيب المنصة يجب أن يكون أكبر من أو يساوي صفر' })
  order?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean({ message: 'حالة التفعيل يجب أن تكون قيمة منطقية' })
  isActive?: boolean;
}

export class CreateFooterContentDto {
  @ApiProperty({ example: 'الجمعية اليمنية لجراحة الأوعية الدموية - تسعى لتطوير الرعاية الصحية المتخصصة في اليمن.' })
  @IsString({ message: 'وصف الفوتر بالعربية يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'وصف الفوتر بالعربية مطلوب' })
  @MaxLength(1000, { message: 'وصف الفوتر بالعربية طويل جداً' })
  descriptionAr: string;

  @ApiProperty({ example: 'The Yemeni Society for Vascular Surgery advances specialized healthcare in Yemen.' })
  @IsString({ message: 'وصف الفوتر بالإنجليزية يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'وصف الفوتر بالإنجليزية مطلوب' })
  @MaxLength(1000, { message: 'وصف الفوتر بالإنجليزية طويل جداً' })
  descriptionEn: string;

  @ApiProperty({ example: 'صنعاء، اليمن شارع الزبيري' })
  @IsString({ message: 'العنوان بالعربية يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'العنوان بالعربية مطلوب' })
  @MaxLength(300, { message: 'العنوان بالعربية طويل جداً' })
  addressAr: string;

  @ApiProperty({ example: 'Al Zubairy Street, Sanaa, Yemen' })
  @IsString({ message: 'العنوان بالإنجليزية يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'العنوان بالإنجليزية مطلوب' })
  @MaxLength(300, { message: 'العنوان بالإنجليزية طويل جداً' })
  addressEn: string;

  @ApiProperty({ example: '+967 123 456 789' })
  @IsString({ message: 'رقم الهاتف يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'رقم الهاتف مطلوب' })
  @MaxLength(50, { message: 'رقم الهاتف طويل جداً' })
  phone: string;

  @ApiProperty({ example: 'info@ysvs.org' })
  @IsEmail({}, { message: 'البريد الإلكتروني غير صالح' })
  @MaxLength(255, { message: 'البريد الإلكتروني طويل جداً' })
  email: string;

  @ApiProperty({ type: [CreateFooterQuickLinkDto] })
  @IsArray({ message: 'الروابط السريعة يجب أن تكون مصفوفة' })
  @ValidateNested({ each: true })
  @Type(() => CreateFooterQuickLinkDto)
  quickLinks: CreateFooterQuickLinkDto[];

  @ApiProperty({ type: [CreateFooterSocialLinkDto] })
  @IsArray({ message: 'روابط التواصل الاجتماعي يجب أن تكون مصفوفة' })
  @ValidateNested({ each: true })
  @Type(() => CreateFooterSocialLinkDto)
  socialLinks: CreateFooterSocialLinkDto[];

  @ApiProperty({ example: 'جميع الحقوق محفوظة.' })
  @IsString({ message: 'نص حقوق النشر بالعربية يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'نص حقوق النشر بالعربية مطلوب' })
  @MaxLength(300, { message: 'نص حقوق النشر بالعربية طويل جداً' })
  copyrightAr: string;

  @ApiProperty({ example: 'All rights reserved.' })
  @IsString({ message: 'نص حقوق النشر بالإنجليزية يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'نص حقوق النشر بالإنجليزية مطلوب' })
  @MaxLength(300, { message: 'نص حقوق النشر بالإنجليزية طويل جداً' })
  copyrightEn: string;
}

export class CreateLegalPageDto {
  @ApiProperty({ example: 'سياسة الخصوصية' })
  @IsString({ message: 'عنوان الصفحة بالعربية يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'عنوان الصفحة بالعربية مطلوب' })
  @MaxLength(200, { message: 'عنوان الصفحة بالعربية طويل جداً' })
  titleAr: string;

  @ApiProperty({ example: 'Privacy Policy' })
  @IsString({ message: 'عنوان الصفحة بالإنجليزية يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'عنوان الصفحة بالإنجليزية مطلوب' })
  @MaxLength(200, { message: 'عنوان الصفحة بالإنجليزية طويل جداً' })
  titleEn: string;

  @ApiProperty({ example: '<h2>مقدمة</h2><p>نحن نحترم خصوصيتك...</p>' })
  @IsString({ message: 'محتوى الصفحة بالعربية يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'محتوى الصفحة بالعربية مطلوب' })
  @MaxLength(50000, { message: 'محتوى الصفحة بالعربية طويل جداً' })
  contentAr: string;

  @ApiProperty({ example: '<h2>Introduction</h2><p>We respect your privacy...</p>' })
  @IsString({ message: 'محتوى الصفحة بالإنجليزية يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'محتوى الصفحة بالإنجليزية مطلوب' })
  @MaxLength(50000, { message: 'محتوى الصفحة بالإنجليزية طويل جداً' })
  contentEn: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt({ message: 'رقم النسخة يجب أن يكون رقماً صحيحاً' })
  @Min(1, { message: 'رقم النسخة يجب أن يكون أكبر من أو يساوي 1' })
  version?: number;

  @ApiPropertyOptional({ example: '2026-03-06T00:00:00.000Z' })
  @IsOptional()
  @IsDateString({}, { message: 'تاريخ السريان يجب أن يكون تاريخاً زمنياً صالحاً' })
  effectiveDate?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean({ message: 'حالة النشر يجب أن تكون قيمة منطقية' })
  isPublished?: boolean;
}

export class CreateLegalPagesDto {
  @ApiProperty({ type: CreateLegalPageDto })
  @ValidateNested()
  @Type(() => CreateLegalPageDto)
  privacy: CreateLegalPageDto;

  @ApiProperty({ type: CreateLegalPageDto })
  @ValidateNested()
  @Type(() => CreateLegalPageDto)
  terms: CreateLegalPageDto;
}

export class CreateHomepageContentDto {
  @ApiPropertyOptional({ example: '66f7e2a6aee7f8b68f5f1a34', nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString({ message: 'معرف مؤتمر العداد يجب أن يكون نصاً' })
  @IsMongoId({ message: 'معرف مؤتمر العداد غير صالح' })
  countdownEventId?: string | null;

  @ApiPropertyOptional({ example: 25, default: 25 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'عدد المؤتمرات يجب أن يكون رقماً صحيحاً' })
  @Min(0, { message: 'عدد المؤتمرات يجب أن يكون أكبر من أو يساوي صفر' })
  conferencesCount?: number;

  @ApiPropertyOptional({ example: 500, default: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'عدد الأعضاء المسجلين يجب أن يكون رقماً صحيحاً' })
  @Min(0, { message: 'عدد الأعضاء المسجلين يجب أن يكون أكبر من أو يساوي صفر' })
  registeredMembersCount?: number;

  @ApiPropertyOptional({ example: 25, default: 25 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'عدد الفعاليات السنوية يجب أن يكون رقماً صحيحاً' })
  @Min(0, { message: 'عدد الفعاليات السنوية يجب أن يكون أكبر من أو يساوي صفر' })
  annualActivitiesCount?: number;
}

export class CreateSiteContentDto {
  @ApiPropertyOptional({ default: 'site-content' })
  @IsOptional()
  @IsString({ message: 'مفتاح الصفحة يجب أن يكون نصاً' })
  @MaxLength(120, { message: 'مفتاح الصفحة طويل جداً' })
  singletonKey?: string;

  @ApiProperty({ type: CreateFooterContentDto })
  @ValidateNested()
  @Type(() => CreateFooterContentDto)
  footer: CreateFooterContentDto;

  @ApiProperty({ type: CreateLegalPagesDto })
  @ValidateNested()
  @Type(() => CreateLegalPagesDto)
  legalPages: CreateLegalPagesDto;

  @ApiPropertyOptional({ type: CreateHomepageContentDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateHomepageContentDto)
  homepage?: CreateHomepageContentDto;
}
