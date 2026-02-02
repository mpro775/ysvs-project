import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsService } from './events.service';
import { RegistrationService } from './registration.service';
import { FormValidatorService } from './services/form-validator.service';
import { EventsController } from './events.controller';
import { Event, EventSchema } from './schemas/event.schema';
import { TicketType, TicketTypeSchema } from './schemas/ticket-type.schema';
import { Registration, RegistrationSchema } from './schemas/registration.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: TicketType.name, schema: TicketTypeSchema },
      { name: Registration.name, schema: RegistrationSchema },
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
