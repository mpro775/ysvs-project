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
import {
  NewsletterSubscriber,
  NewsletterSubscriberSchema,
} from '../newsletter/schemas/newsletter-subscriber.schema';
import {
  ContactMessage,
  ContactMessageSchema,
} from '../contact/schemas/contact-message.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: User.name, schema: UserSchema },
      { name: Certificate.name, schema: CertificateSchema },
      { name: Article.name, schema: ArticleSchema },
      { name: Registration.name, schema: RegistrationSchema },
      { name: NewsletterSubscriber.name, schema: NewsletterSubscriberSchema },
      { name: ContactMessage.name, schema: ContactMessageSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
