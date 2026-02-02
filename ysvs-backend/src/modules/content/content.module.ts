import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContentService } from './content.service';
import { ContentController } from './content.controller';
import { Article, ArticleSchema } from './schemas/article.schema';
import { Category, CategorySchema } from './schemas/category.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Article.name, schema: ArticleSchema },
      { name: Category.name, schema: CategorySchema },
    ]),
  ],
  controllers: [ContentController],
  providers: [ContentService],
  exports: [
    ContentService,
    MongooseModule.forFeature([{ name: Article.name, schema: ArticleSchema }]),
  ],
})
export class ContentModule {}
