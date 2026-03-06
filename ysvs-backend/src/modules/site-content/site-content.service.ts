import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Model } from 'mongoose';
import {
  FooterQuickLink,
  FooterSocialLink,
  LegalPage,
  SiteContent,
  SiteContentDocument,
} from './schemas/site-content.schema';
import {
  CreateSiteContentDto,
  UpdateFooterContentDto,
  UpdateLegalPageDto,
  UpdateSiteContentDto,
} from './dto';

type LegalPageType = 'privacy' | 'terms';

interface PublicLegalMetadata {
  titleAr: string;
  titleEn: string;
  version: number;
  effectiveDate?: Date;
  slug: LegalPageType;
}

export interface SitePublicResponse {
  footer: SiteContent['footer'];
  legal: PublicLegalMetadata[];
}

@Injectable()
export class SiteContentService {
  private readonly SINGLETON_KEY = 'site-content';
  private readonly CACHE_TTL = 3600000; // 1 hour
  private readonly PUBLIC_CACHE_KEY = 'site:public';
  private readonly PRIVACY_CACHE_KEY = 'site:legal:privacy';
  private readonly TERMS_CACHE_KEY = 'site:legal:terms';

  constructor(
    @InjectModel(SiteContent.name)
    private readonly siteContentModel: Model<SiteContentDocument>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async findPublic(): Promise<SitePublicResponse> {
    const cached = await this.cacheManager.get<SitePublicResponse>(this.PUBLIC_CACHE_KEY);
    if (cached) {
      return cached;
    }

    const content = await this.getOrCreateContent();
    const response: SitePublicResponse = {
      footer: content.footer,
      legal: this.getPublishedLegalMetadata(content),
    };

    await this.cacheManager.set(this.PUBLIC_CACHE_KEY, response, this.CACHE_TTL);
    return response;
  }

  async findAdmin(): Promise<SiteContent> {
    return this.getOrCreateContent();
  }

  async findPublicLegalPage(type: LegalPageType): Promise<LegalPage> {
    const cacheKey = this.getLegalCacheKey(type);
    const cached = await this.cacheManager.get<LegalPage>(cacheKey);
    if (cached) {
      return cached;
    }

    const content = await this.getOrCreateContent();
    const page = content.legalPages[type];

    if (!page?.isPublished) {
      throw new NotFoundException(
        type === 'privacy'
          ? 'صفحة سياسة الخصوصية غير منشورة حالياً'
          : 'صفحة الشروط والأحكام غير منشورة حالياً',
      );
    }

    await this.cacheManager.set(cacheKey, page, this.CACHE_TTL);
    return page;
  }

  async update(updateDto: UpdateSiteContentDto): Promise<SiteContent> {
    const existing = await this.getOrCreateContent();

    const payload: UpdateSiteContentDto = { ...updateDto };
    if (updateDto.footer) {
      payload.footer = this.normalizeFooter(updateDto.footer);
    }

    if (updateDto.legalPages?.privacy) {
      payload.legalPages = payload.legalPages || {};
      payload.legalPages.privacy = this.normalizeLegalPage(updateDto.legalPages.privacy);
    }

    if (updateDto.legalPages?.terms) {
      payload.legalPages = payload.legalPages || {};
      payload.legalPages.terms = this.normalizeLegalPage(updateDto.legalPages.terms);
    }

    const updated = await this.siteContentModel
      .findByIdAndUpdate(existing._id, payload, { new: true, runValidators: true })
      .exec();

    if (!updated) {
      throw new NotFoundException('محتوى الموقع العام غير موجود');
    }

    await this.invalidateCache();
    return updated;
  }

  async updateFooter(updateDto: UpdateFooterContentDto): Promise<SiteContent['footer']> {
    const existing = await this.getOrCreateContent();
    const normalized = this.normalizeFooter(updateDto);
    const entries = Object.entries(normalized);

    if (entries.length === 0) {
      return existing.footer;
    }

    const updated = await this.siteContentModel
      .findByIdAndUpdate(
        existing._id,
        {
          $set: {
            ...entries.reduce<Record<string, unknown>>((acc, [key, value]) => {
              acc[`footer.${key}`] = value;
              return acc;
            }, {}),
          },
        },
        { new: true, runValidators: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException('محتوى الفوتر غير موجود');
    }

    await this.invalidateCache();
    return updated.footer;
  }

  async updateLegalPage(type: LegalPageType, updateDto: UpdateLegalPageDto): Promise<LegalPage> {
    const existing = await this.getOrCreateContent();
    const normalized = this.normalizeLegalPage(updateDto);
    const entries = Object.entries(normalized);

    if (entries.length === 0) {
      return existing.legalPages[type];
    }

    const updated = await this.siteContentModel
      .findByIdAndUpdate(
        existing._id,
        {
          $set: {
            ...entries.reduce<Record<string, unknown>>((acc, [key, value]) => {
              acc[`legalPages.${type}.${key}`] = value;
              return acc;
            }, {}),
          },
        },
        { new: true, runValidators: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException('تعذر تحديث الصفحة القانونية');
    }

    await this.invalidateCache();
    return updated.legalPages[type];
  }

  async publishLegalPage(type: LegalPageType): Promise<LegalPage> {
    const existing = await this.getOrCreateContent();
    const currentPage = existing.legalPages[type];
    const nextVersion = (currentPage.version || 1) + 1;
    const now = new Date();

    const updated = await this.siteContentModel
      .findByIdAndUpdate(
        existing._id,
        {
          $set: {
            [`legalPages.${type}.isPublished`]: true,
            [`legalPages.${type}.publishedAt`]: now,
            [`legalPages.${type}.effectiveDate`]: now,
            [`legalPages.${type}.version`]: nextVersion,
          },
        },
        { new: true, runValidators: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException('تعذر نشر الصفحة القانونية');
    }

    await this.invalidateCache();
    return updated.legalPages[type];
  }

  private getLegalCacheKey(type: LegalPageType): string {
    return type === 'privacy' ? this.PRIVACY_CACHE_KEY : this.TERMS_CACHE_KEY;
  }

  private getPublishedLegalMetadata(content: SiteContent): PublicLegalMetadata[] {
    const legalPages: Array<{ slug: LegalPageType; page: LegalPage }> = [
      { slug: 'privacy', page: content.legalPages.privacy },
      { slug: 'terms', page: content.legalPages.terms },
    ];

    return legalPages
      .filter(({ page }) => page.isPublished)
      .map(({ slug, page }) => ({
        slug,
        titleAr: page.titleAr,
        titleEn: page.titleEn,
        version: page.version,
        effectiveDate: page.effectiveDate,
      }));
  }

  private async getOrCreateContent(): Promise<SiteContent> {
    let content = await this.siteContentModel
      .findOne({ singletonKey: this.SINGLETON_KEY })
      .exec();

    if (!content) {
      content = await new this.siteContentModel(this.getDefaultContent()).save();
    }

    return content;
  }

  private normalizeFooter(
    footer: UpdateFooterContentDto,
  ): UpdateFooterContentDto {
    const normalized: UpdateFooterContentDto = { ...footer };

    if (footer.quickLinks) {
      normalized.quickLinks = this.normalizeQuickLinks(footer.quickLinks);
    }

    if (footer.socialLinks) {
      normalized.socialLinks = this.normalizeSocialLinks(footer.socialLinks);
    }

    if (typeof footer.descriptionAr === 'string') {
      normalized.descriptionAr = footer.descriptionAr.trim();
    }

    if (typeof footer.descriptionEn === 'string') {
      normalized.descriptionEn = footer.descriptionEn.trim();
    }

    if (typeof footer.addressAr === 'string') {
      normalized.addressAr = footer.addressAr.trim();
    }

    if (typeof footer.addressEn === 'string') {
      normalized.addressEn = footer.addressEn.trim();
    }

    if (typeof footer.phone === 'string') {
      normalized.phone = footer.phone.trim();
    }

    if (typeof footer.email === 'string') {
      normalized.email = footer.email.trim().toLowerCase();
    }

    if (typeof footer.copyrightAr === 'string') {
      normalized.copyrightAr = footer.copyrightAr.trim();
    }

    if (typeof footer.copyrightEn === 'string') {
      normalized.copyrightEn = footer.copyrightEn.trim();
    }

    return normalized;
  }

  private normalizeQuickLinks(
    links: UpdateFooterContentDto['quickLinks'] = [],
  ): FooterQuickLink[] {
    return [...links]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((link, index) => ({
        labelAr: link.labelAr?.trim() || '',
        labelEn: link.labelEn?.trim() || '',
        href: link.href?.trim() || '',
        order: index,
        isActive: link.isActive ?? true,
      })) as FooterQuickLink[];
  }

  private normalizeSocialLinks(
    links: UpdateFooterContentDto['socialLinks'] = [],
  ): FooterSocialLink[] {
    return [...links]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((link, index) => ({
        platform: link.platform?.trim().toLowerCase() || '',
        url: link.url?.trim() || '',
        order: index,
        isActive: link.isActive ?? true,
      })) as FooterSocialLink[];
  }

  private normalizeLegalPage(updateDto: UpdateLegalPageDto): UpdateLegalPageDto {
    const normalized: UpdateLegalPageDto = { ...updateDto };

    if (typeof updateDto.titleAr === 'string') {
      normalized.titleAr = updateDto.titleAr.trim();
    }

    if (typeof updateDto.titleEn === 'string') {
      normalized.titleEn = updateDto.titleEn.trim();
    }

    if (typeof updateDto.contentAr === 'string') {
      normalized.contentAr = updateDto.contentAr.trim();
    }

    if (typeof updateDto.contentEn === 'string') {
      normalized.contentEn = updateDto.contentEn.trim();
    }

    if (typeof updateDto.effectiveDate === 'string') {
      normalized.effectiveDate = updateDto.effectiveDate;
    }

    return normalized;
  }

  private getDefaultContent(): CreateSiteContentDto {
    return {
      singletonKey: this.SINGLETON_KEY,
      footer: {
        descriptionAr:
          'الجمعية اليمنية لجراحة الأوعية الدموية - تسعى لتطوير الرعاية الصحية المتخصصة في اليمن من خلال التدريب والبحث العلمي.',
        descriptionEn:
          'The Yemeni Society for Vascular Surgery advances specialized healthcare in Yemen through training and scientific research.',
        addressAr: 'صنعاء، اليمن شارع الزبيري',
        addressEn: 'Al Zubairy Street, Sanaa, Yemen',
        phone: '+967 123 456 789',
        email: 'info@ysvs.org',
        quickLinks: [
          { labelAr: 'عن الجمعية', labelEn: 'About', href: '/about', order: 0, isActive: true },
          { labelAr: 'المؤتمرات', labelEn: 'Events', href: '/events', order: 1, isActive: true },
          { labelAr: 'الأخبار', labelEn: 'News', href: '/news', order: 2, isActive: true },
          {
            labelAr: 'التحقق من الشهادات',
            labelEn: 'Certificate Verification',
            href: '/verify',
            order: 3,
            isActive: true,
          },
          { labelAr: 'تواصل معنا', labelEn: 'Contact', href: '/contact', order: 4, isActive: true },
        ],
        socialLinks: [
          {
            platform: 'facebook',
            url: 'https://facebook.com',
            order: 0,
            isActive: true,
          },
          {
            platform: 'twitter',
            url: 'https://twitter.com',
            order: 1,
            isActive: true,
          },
          {
            platform: 'instagram',
            url: 'https://instagram.com',
            order: 2,
            isActive: true,
          },
          {
            platform: 'youtube',
            url: 'https://youtube.com',
            order: 3,
            isActive: true,
          },
        ],
        copyrightAr: 'جميع الحقوق محفوظة.',
        copyrightEn: 'All rights reserved.',
      },
      legalPages: {
        privacy: {
          titleAr: 'سياسة الخصوصية',
          titleEn: 'Privacy Policy',
          contentAr:
            '<h2>سياسة الخصوصية</h2><p>نلتزم بحماية خصوصية البيانات الشخصية للمستخدمين، واستخدامها فقط للأغراض المشروعة المتعلقة بخدمات الجمعية.</p>',
          contentEn:
            '<h2>Privacy Policy</h2><p>We are committed to protecting users personal data and using it only for lawful purposes related to society services.</p>',
          version: 1,
          effectiveDate: new Date().toISOString(),
          isPublished: true,
        },
        terms: {
          titleAr: 'الشروط والأحكام',
          titleEn: 'Terms and Conditions',
          contentAr:
            '<h2>الشروط والأحكام</h2><p>باستخدامك للموقع، فإنك توافق على الالتزام بسياسات الجمعية ولوائح الاستخدام المعتمدة.</p>',
          contentEn:
            '<h2>Terms and Conditions</h2><p>By using this website, you agree to comply with society policies and approved usage regulations.</p>',
          version: 1,
          effectiveDate: new Date().toISOString(),
          isPublished: true,
        },
      },
    };
  }

  private async invalidateCache(): Promise<void> {
    await Promise.all([
      this.cacheManager.del(this.PUBLIC_CACHE_KEY),
      this.cacheManager.del(this.PRIVACY_CACHE_KEY),
      this.cacheManager.del(this.TERMS_CACHE_KEY),
    ]);
  }
}
