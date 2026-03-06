import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/schemas/user.schema';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsPublisherService } from './notifications.publisher.service';
import { NotificationsController } from './notifications.controller';
import {
  AdminNotification,
  AdminNotificationSchema,
} from './schemas/admin-notification.schema';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: AdminNotification.name, schema: AdminNotificationSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret') || 'default-secret',
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsGateway, NotificationsPublisherService, NotificationsService],
  exports: [NotificationsGateway, NotificationsPublisherService, NotificationsService],
})
export class NotificationsModule {}
