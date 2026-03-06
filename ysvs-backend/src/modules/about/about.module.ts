import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AboutController } from './about.controller';
import { AboutService } from './about.service';
import { AboutContent, AboutContentSchema } from './schemas/about-content.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AboutContent.name, schema: AboutContentSchema },
    ]),
  ],
  controllers: [AboutController],
  providers: [AboutService],
  exports: [AboutService],
})
export class AboutModule {}
