import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsService } from './events.service';
import { RegistrationService } from './registration.service';
import { FormValidatorService } from './services/form-validator.service';
import { EventsController } from './events.controller';
import { Event, EventSchema } from './schemas/event.schema';
import { TicketType, TicketTypeSchema } from './schemas/ticket-type.schema';
import { Registration, RegistrationSchema } from './schemas/registration.schema';
import { MediaModule } from '../media/media.module';
import { User, UserSchema } from '../users/schemas/user.schema';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MediaModule,
    NotificationsModule,
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: TicketType.name, schema: TicketTypeSchema },
      { name: Registration.name, schema: RegistrationSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [EventsController],
  providers: [EventsService, RegistrationService, FormValidatorService],
  exports: [
    EventsService,
    RegistrationService,
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: Registration.name, schema: RegistrationSchema },
    ]),
  ],
})
export class EventsModule {}
