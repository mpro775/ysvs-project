import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SiteContentController } from './site-content.controller';
import { SiteContentService } from './site-content.service';
import { SiteContent, SiteContentSchema } from './schemas/site-content.schema';
import { Event, EventSchema } from '../events/schemas/event.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SiteContent.name, schema: SiteContentSchema },
      { name: Event.name, schema: EventSchema },
    ]),
  ],
  controllers: [SiteContentController],
  providers: [SiteContentService],
  exports: [SiteContentService],
})
export class SiteContentModule {}
