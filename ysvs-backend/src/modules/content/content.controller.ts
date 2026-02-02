import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ContentService } from './content.service';
import {
  CreateArticleDto,
  ArticlesQueryDto,
  UpdateArticleDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from './dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, UserRole } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ArticleStatus } from './schemas/article.schema';

@ApiTags('Content')
@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  // ============= ARTICLES =============

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Post('articles')
  @ApiOperation({ summary: 'Create a new article (Admin only)' })
  @ApiResponse({ status: 201, description: 'Article created successfully' })
  createArticle(
    @Body() createArticleDto: CreateArticleDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.contentService.createArticle(createArticleDto, userId);
  }

  @Public()
  @Get('articles')
  @ApiOperation({ summary: 'Get published articles with pagination' })
  @ApiResponse({ status: 200, description: 'List of published articles' })
  findPublishedArticles(@Query() query: ArticlesQueryDto) {
    return this.contentService.findPublishedArticles(query);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get('articles/all')
  @ApiOperation({ summary: 'Get all articles including drafts (Admin only)' })
  @ApiQuery({ name: 'status', enum: ArticleStatus, required: false })
  @ApiResponse({ status: 200, description: 'List of all articles' })
  findAllArticles(
    @Query() paginationDto: PaginationDto,
    @Query('status') status?: ArticleStatus,
  ) {
    return this.contentService.findAllArticles(paginationDto, status);
  }

  @Public()
  @Get('articles/featured')
  @ApiOperation({ summary: 'Get featured articles' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of featured articles' })
  findFeaturedArticles(@Query('limit') limit?: number) {
    return this.contentService.findFeaturedArticles(limit);
  }

  @Public()
  @Get('articles/:slugOrId')
  @ApiOperation({ summary: 'Get article by slug or ID' })
  @ApiResponse({ status: 200, description: 'Article details' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  findArticleBySlug(@Param('slugOrId') slugOrId: string) {
    return this.contentService.findArticleBySlug(slugOrId);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Patch('articles/:id')
  @ApiOperation({ summary: 'Update article (Admin only)' })
  @ApiResponse({ status: 200, description: 'Article updated successfully' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  updateArticle(
    @Param('id') id: string,
    @Body() updateArticleDto: UpdateArticleDto,
  ) {
    return this.contentService.updateArticle(id, updateArticleDto);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Delete('articles/:id')
  @ApiOperation({ summary: 'Delete article (Admin only)' })
  @ApiResponse({ status: 200, description: 'Article deleted successfully' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  removeArticle(@Param('id') id: string) {
    return this.contentService.removeArticle(id);
  }

  // ============= CATEGORIES =============

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Post('categories')
  @ApiOperation({ summary: 'Create a new category (Admin only)' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return this.contentService.createCategory(createCategoryDto);
  }

  @Public()
  @Get('categories')
  @ApiOperation({ summary: 'Get all active categories' })
  @ApiResponse({ status: 200, description: 'List of categories' })
  findAllCategories() {
    return this.contentService.findAllCategories();
  }

  @Public()
  @Get('categories/:slug')
  @ApiOperation({ summary: 'Get category by slug' })
  @ApiResponse({ status: 200, description: 'Category details' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  findCategoryBySlug(@Param('slug') slug: string) {
    return this.contentService.findCategoryBySlug(slug);
  }

  @Public()
  @Get('categories/:slug/articles')
  @ApiOperation({ summary: 'Get articles by category' })
  @ApiResponse({ status: 200, description: 'List of articles in category' })
  findArticlesByCategory(
    @Param('slug') slug: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.contentService.findArticlesByCategory(slug, paginationDto);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update category (Admin only)' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.contentService.updateCategory(id, updateCategoryDto);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete category (Admin only)' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  removeCategory(@Param('id') id: string) {
    return this.contentService.removeCategory(id);
  }
}
