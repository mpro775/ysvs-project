import {
  Injectable,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Article, ArticleDocument, ArticleStatus } from './schemas/article.schema';
import { Category, CategoryDocument } from './schemas/category.schema';
import {
  ArticlesQueryDto,
  CreateArticleDto,
  UpdateArticleDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from './dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class ContentService {
  constructor(
    @InjectModel(Article.name) private articleModel: Model<ArticleDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  // ============= ARTICLES =============

  async createArticle(
    createArticleDto: CreateArticleDto,
    authorId: string,
  ): Promise<Article> {
    const article = new this.articleModel({
      ...createArticleDto,
      author: authorId,
      publishedAt:
        createArticleDto.status === ArticleStatus.PUBLISHED
          ? new Date()
          : undefined,
    });

    const savedArticle = await article.save();
    await this.invalidateArticleCache();
    return savedArticle;
  }

  async findAllArticles(
    paginationDto: PaginationDto,
    status?: ArticleStatus,
  ): Promise<PaginatedResult<Article>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};
    if (status) {
      query.status = status;
    }

    const [articles, total] = await Promise.all([
      this.articleModel
        .find(query)
        .populate('category', 'nameAr nameEn slug')
        .populate('author', 'fullNameAr fullNameEn')
        .skip(skip)
        .limit(limit)
        .sort({ publishedAt: -1, createdAt: -1 })
        .exec(),
      this.articleModel.countDocuments(query),
    ]);

    return new PaginatedResult(articles, total, page, limit);
  }

  async findPublishedArticles(
    queryDto: ArticlesQueryDto,
  ): Promise<PaginatedResult<Article>> {
    const cacheKey = `articles:published:${queryDto.page}:${queryDto.limit}`;
    const cached = await this.cacheManager.get<PaginatedResult<Article>>(cacheKey);

    if (cached) {
      return cached;
    }

    // Public endpoint: always return published only (ignore status param for security)
    const result = await this.findAllArticles(queryDto, ArticleStatus.PUBLISHED);
    await this.cacheManager.set(cacheKey, result, 300000); // 5 minutes
    return result;
  }

  async findFeaturedArticles(limit: number = 5): Promise<Article[]> {
    const cacheKey = `articles:featured:${limit}`;
    const cached = await this.cacheManager.get<Article[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const articles = await this.articleModel
      .find({ status: ArticleStatus.PUBLISHED, isFeatured: true })
      .populate('category', 'nameAr nameEn slug')
      .populate('author', 'fullNameAr fullNameEn')
      .limit(limit)
      .sort({ publishedAt: -1 })
      .exec();

    await this.cacheManager.set(cacheKey, articles, 300000);
    return articles;
  }

  async findArticleBySlug(slugOrId: string): Promise<Article> {
    let article: ArticleDocument | null = null;

    // Check if it's a valid MongoDB ObjectId
    if (Types.ObjectId.isValid(slugOrId)) {
      article = await this.articleModel
        .findById(slugOrId)
        .populate('category', 'nameAr nameEn slug')
        .populate('author', 'fullNameAr fullNameEn')
        .exec();
    }

    // If not found by ID, try by slug
    if (!article) {
      article = await this.articleModel
        .findOne({ slug: slugOrId })
        .populate('category', 'nameAr nameEn slug')
        .populate('author', 'fullNameAr fullNameEn')
        .exec();
    }

    if (!article) {
      throw new NotFoundException('المقال غير موجود');
    }

    // Increment view count
    await this.articleModel.findByIdAndUpdate(article._id, {
      $inc: { viewCount: 1 },
    });

    return article;
  }

  async findArticleById(id: string): Promise<Article> {
    const article = await this.articleModel
      .findById(id)
      .populate('category', 'nameAr nameEn slug')
      .populate('author', 'fullNameAr fullNameEn')
      .exec();

    if (!article) {
      throw new NotFoundException('المقال غير موجود');
    }

    return article;
  }

  async updateArticle(
    id: string,
    updateArticleDto: UpdateArticleDto,
  ): Promise<Article> {
    const updateData: Record<string, unknown> = { ...updateArticleDto };

    // Set publishedAt if status changed to published
    if (updateArticleDto.status === ArticleStatus.PUBLISHED) {
      const existingArticle = await this.articleModel.findById(id);
      if (existingArticle && existingArticle.status !== ArticleStatus.PUBLISHED) {
        updateData.publishedAt = new Date();
      }
    }

    const article = await this.articleModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('category', 'nameAr nameEn slug')
      .populate('author', 'fullNameAr fullNameEn')
      .exec();

    if (!article) {
      throw new NotFoundException('المقال غير موجود');
    }

    await this.invalidateArticleCache();
    return article;
  }

  async removeArticle(id: string): Promise<void> {
    const result = await this.articleModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException('المقال غير موجود');
    }

    await this.invalidateArticleCache();
  }

  // ============= CATEGORIES =============

  async createCategory(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const category = new this.categoryModel(createCategoryDto);
    const savedCategory = await category.save();
    await this.invalidateCategoryCache();
    return savedCategory;
  }

  async findAllCategories(): Promise<Category[]> {
    const cacheKey = 'categories:all';
    const cached = await this.cacheManager.get<Category[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const categories = await this.categoryModel
      .find({ isActive: true })
      .sort({ order: 1, nameAr: 1 })
      .exec();

    await this.cacheManager.set(cacheKey, categories, 3600000); // 1 hour
    return categories;
  }

  async findCategoryBySlug(slug: string): Promise<Category> {
    const category = await this.categoryModel.findOne({ slug }).exec();

    if (!category) {
      throw new NotFoundException('التصنيف غير موجود');
    }

    return category;
  }

  async findCategoryById(id: string): Promise<Category> {
    const category = await this.categoryModel.findById(id).exec();

    if (!category) {
      throw new NotFoundException('التصنيف غير موجود');
    }

    return category;
  }

  async updateCategory(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.categoryModel
      .findByIdAndUpdate(id, updateCategoryDto, { new: true })
      .exec();

    if (!category) {
      throw new NotFoundException('التصنيف غير موجود');
    }

    await this.invalidateCategoryCache();
    return category;
  }

  async removeCategory(id: string): Promise<void> {
    // Check if category has articles
    const articleCount = await this.articleModel.countDocuments({ category: id });

    if (articleCount > 0) {
      throw new NotFoundException(
        `لا يمكن حذف التصنيف لأنه يحتوي على ${articleCount} مقال`,
      );
    }

    const result = await this.categoryModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException('التصنيف غير موجود');
    }

    await this.invalidateCategoryCache();
  }

  async findArticlesByCategory(
    categorySlug: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Article>> {
    const category = await this.findCategoryBySlug(categorySlug);
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [articles, total] = await Promise.all([
      this.articleModel
        .find({ category: category._id, status: ArticleStatus.PUBLISHED })
        .populate('category', 'nameAr nameEn slug')
        .populate('author', 'fullNameAr fullNameEn')
        .skip(skip)
        .limit(limit)
        .sort({ publishedAt: -1 })
        .exec(),
      this.articleModel.countDocuments({
        category: category._id,
        status: ArticleStatus.PUBLISHED,
      }),
    ]);

    return new PaginatedResult(articles, total, page, limit);
  }

  // ============= CACHE HELPERS =============

  private async invalidateArticleCache(): Promise<void> {
    // Clear specific cache keys
    // Note: In production with Redis, you could use pattern matching
    const keysToDelete = [
      'articles:published:1:10',
      'articles:published:1:20',
      'articles:featured:5',
      'articles:featured:10',
    ];
    await Promise.all(keysToDelete.map((key) => this.cacheManager.del(key)));
  }

  private async invalidateCategoryCache(): Promise<void> {
    await this.cacheManager.del('categories:all');
  }
}
