import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Model } from 'mongoose';
import {
  AboutContent,
  AboutContentDocument,
  AboutObjective,
} from './schemas/about-content.schema';
import {
  CreateAboutContentDto,
  CreateAboutObjectiveDto,
  UpdateAboutContentDto,
} from './dto';

@Injectable()
export class AboutService {
  private readonly CACHE_KEY = 'about:content';
  private readonly CACHE_TTL = 3600000; // 1 hour
  private readonly SINGLETON_KEY = 'about';

  constructor(
    @InjectModel(AboutContent.name)
    private aboutContentModel: Model<AboutContentDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async findPublic(): Promise<AboutContent> {
    const cached = await this.cacheManager.get<AboutContent>(this.CACHE_KEY);

    if (cached) {
      return cached;
    }

    const content = await this.getOrCreateContent();
    await this.cacheManager.set(this.CACHE_KEY, content, this.CACHE_TTL);

    return content;
  }

  async findAdmin(): Promise<AboutContent> {
    return this.getOrCreateContent();
  }

  async update(updateDto: UpdateAboutContentDto): Promise<AboutContent> {
    const existing = await this.getOrCreateContent();

    const payload: UpdateAboutContentDto = { ...updateDto };
    if (updateDto.objectives) {
      payload.objectives = this.normalizeObjectives(updateDto.objectives);
    }

    const updated = await this.aboutContentModel
      .findByIdAndUpdate(existing._id, payload, { new: true, runValidators: true })
      .exec();

    if (!updated) {
      throw new NotFoundException('محتوى صفحة عن الجمعية غير موجود');
    }

    await this.invalidateCache();
    return updated;
  }

  private async getOrCreateContent(): Promise<AboutContent> {
    let content = await this.aboutContentModel
      .findOne({ singletonKey: this.SINGLETON_KEY })
      .exec();

    if (!content) {
      const defaultContent = this.getDefaultContent();
      content = await new this.aboutContentModel(defaultContent).save();
    }

    return content;
  }

  private normalizeObjectives(
    objectives: CreateAboutObjectiveDto[],
  ): AboutObjective[] {
    return [...objectives]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((objective, index) => ({
        textAr: objective.textAr,
        textEn: objective.textEn,
        order: index,
        isActive: objective.isActive ?? true,
      })) as AboutObjective[];
  }

  private getDefaultContent(): CreateAboutContentDto & { singletonKey: string } {
    return {
      singletonKey: this.SINGLETON_KEY,
      heroTitleAr: 'عن الجمعية',
      heroTitleEn: 'About The Society',
      heroDescriptionAr:
        'الجمعية اليمنية لجراحة الأوعية الدموية هي جمعية طبية متخصصة تأسست بهدف تطوير وتعزيز مجال جراحة الأوعية الدموية في اليمن',
      heroDescriptionEn:
        'The Yemeni Society for Vascular Surgery is a specialized medical society founded to advance vascular surgery in Yemen.',
      visionTitleAr: 'رؤيتنا',
      visionTitleEn: 'Our Vision',
      visionTextAr:
        'أن نكون الجمعية الرائدة في مجال جراحة الأوعية الدموية على مستوى المنطقة، ونساهم في تقديم أفضل رعاية صحية للمرضى من خلال التعليم المستمر والبحث العلمي.',
      visionTextEn:
        'To be the leading society in vascular surgery in the region and contribute to better patient care through continuous education and scientific research.',
      missionTitleAr: 'رسالتنا',
      missionTitleEn: 'Our Mission',
      missionTextAr:
        'تطوير مهارات ومعارف الأطباء في مجال جراحة الأوعية الدموية من خلال تنظيم المؤتمرات والورش العلمية، وتبادل الخبرات مع الجمعيات الدولية.',
      missionTextEn:
        'Develop physicians skills and knowledge in vascular surgery through conferences, workshops, and knowledge exchange with international societies.',
      objectives: [
        {
          textAr: 'تنظيم المؤتمرات والندوات العلمية المتخصصة',
          textEn: 'Organize specialized scientific conferences and seminars',
          order: 0,
          isActive: true,
        },
        {
          textAr: 'توفير برامج التعليم الطبي المستمر (CME)',
          textEn: 'Provide continuing medical education (CME) programs',
          order: 1,
          isActive: true,
        },
        {
          textAr: 'تعزيز التعاون مع الجمعيات الطبية المحلية والدولية',
          textEn: 'Strengthen collaboration with local and international medical societies',
          order: 2,
          isActive: true,
        },
        {
          textAr: 'دعم البحث العلمي في مجال جراحة الأوعية',
          textEn: 'Support scientific research in vascular surgery',
          order: 3,
          isActive: true,
        },
        {
          textAr: 'رفع مستوى الوعي الصحي في المجتمع',
          textEn: 'Raise health awareness in the community',
          order: 4,
          isActive: true,
        },
        {
          textAr: 'تبادل الخبرات والمعرفة بين الأعضاء',
          textEn: 'Exchange expertise and knowledge among members',
          order: 5,
          isActive: true,
        },
      ],
    };
  }

  private async invalidateCache(): Promise<void> {
    await this.cacheManager.del(this.CACHE_KEY);
  }
}
