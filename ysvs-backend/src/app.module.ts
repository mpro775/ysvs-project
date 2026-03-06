import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule } from '@nestjs/throttler';
import {
  appConfig,
  databaseConfig,
  jwtConfig,
  redisConfig,
  mailConfig,
  storageConfig,
  throttleConfig,
  newsletterConfig,
  contactConfig,
} from './config';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { EventsModule } from './modules/events/events.module';
import { CertificatesModule } from './modules/certificates/certificates.module';
import { ContentModule } from './modules/content/content.module';
import { BoardModule } from './modules/board/board.module';
import { AboutModule } from './modules/about/about.module';
import { MediaModule } from './modules/media/media.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { NewsletterModule } from './modules/newsletter/newsletter.module';
import { ContactModule } from './modules/contact/contact.module';
import { SiteContentModule } from './modules/site-content/site-content.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        jwtConfig,
        redisConfig,
        mailConfig,
        storageConfig,
        throttleConfig,
        newsletterConfig,
        contactConfig,
      ],
    }),

    // Database
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
      }),
      inject: [ConfigService],
    }),

    // Cache
    CacheModule.register({
      isGlobal: true,
      ttl: 60000, // 1 minute default
      max: 100,
    }),

    // Rate Limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ([
        {
          ttl: configService.get<number>('throttle.ttl') || 60,
          limit: configService.get<number>('throttle.limit') || 100,
        },
      ]),
      inject: [ConfigService],
    }),

    // Feature Modules
    AuthModule,
    UsersModule,
    EventsModule,
    CertificatesModule,
    ContentModule,
    BoardModule,
    AboutModule,
    MediaModule,
    DashboardModule,
    NewsletterModule,
    ContactModule,
    SiteContentModule,
    NotificationsModule,
  ],
})
export class AppModule {}
