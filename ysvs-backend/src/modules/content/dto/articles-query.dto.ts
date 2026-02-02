import { IsOptional, IsEnum } from 'class-validator';
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
}
