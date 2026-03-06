import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { databaseConfig } from '../../config';
import { SeedService } from './seed.service';

// Schemas
import { User, UserSchema } from '../../modules/users/schemas/user.schema';
import { BoardMember, BoardMemberSchema } from '../../modules/board/schemas/board-member.schema';
import {
  AboutContent,
  AboutContentSchema,
} from '../../modules/about/schemas/about-content.schema';
import { Category, CategorySchema } from '../../modules/content/schemas/category.schema';
import { Article, ArticleSchema } from '../../modules/content/schemas/article.schema';
import {
  CertificateTemplate,
  CertificateTemplateSchema,
} from '../../modules/certificates/schemas/certificate-template.schema';
import { Certificate, CertificateSchema } from '../../modules/certificates/schemas/certificate.schema';
import { Event, EventSchema } from '../../modules/events/schemas/event.schema';
import { TicketType, TicketTypeSchema } from '../../modules/events/schemas/ticket-type.schema';
import { Registration, RegistrationSchema } from '../../modules/events/schemas/registration.schema';
import {
  SiteContent,
  SiteContentSchema,
} from '../../modules/site-content/schemas/site-content.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: BoardMember.name, schema: BoardMemberSchema },
      { name: AboutContent.name, schema: AboutContentSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Article.name, schema: ArticleSchema },
      { name: CertificateTemplate.name, schema: CertificateTemplateSchema },
      { name: Certificate.name, schema: CertificateSchema },
      { name: Event.name, schema: EventSchema },
      { name: TicketType.name, schema: TicketTypeSchema },
      { name: Registration.name, schema: RegistrationSchema },
      { name: SiteContent.name, schema: SiteContentSchema },
    ]),
  ],
  providers: [SeedService],
})
export class SeedModule {}
