import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Event, EventSchema } from '../events/schemas/event.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Certificate, CertificateSchema } from '../certificates/schemas/certificate.schema';
import { Article, ArticleSchema } from '../content/schemas/article.schema';
import {
  Registration,
  RegistrationSchema,
} from '../events/schemas/registration.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: User.name, schema: UserSchema },
      { name: Certificate.name, schema: CertificateSchema },
      { name: Article.name, schema: ArticleSchema },
      { name: Registration.name, schema: RegistrationSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
