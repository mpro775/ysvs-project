import { IsOptional, IsEnum, IsString, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { ArticleStatus } from '../schemas/article.schema';

export class ArticlesQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by article status (public endpoint returns published only)',
    enum: ArticleStatus,
  })
  @IsOptional()
  @IsEnum(ArticleStatus)
  status?: ArticleStatus;

  @ApiPropertyOptional({ description: 'Search in titles and excerpts' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by category id or slug' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Filter by featured articles only' })
  @IsOptional()
  @IsBoolean()
  featured?: boolean;
}
