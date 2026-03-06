import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CertificatesService } from './certificates.service';
import { CertificatesController } from './certificates.controller';
import { PdfGeneratorService } from './services/pdf-generator.service';
import { SerialGeneratorService } from './services/serial-generator.service';
import { CertificateMailService } from './services/certificate-mail.service';
import { Certificate, CertificateSchema } from './schemas/certificate.schema';
import {
  CertificateTemplate,
  CertificateTemplateSchema,
} from './schemas/certificate-template.schema';
import { EventsModule } from '../events/events.module';
import { MediaModule } from '../media/media.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Certificate.name, schema: CertificateSchema },
      { name: CertificateTemplate.name, schema: CertificateTemplateSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret') || 'ysvs-certificates-secret',
      }),
    }),
    EventsModule,
    MediaModule,
    NotificationsModule,
  ],
  controllers: [CertificatesController],
  providers: [
    CertificatesService,
    PdfGeneratorService,
    SerialGeneratorService,
    CertificateMailService,
  ],
  exports: [
    CertificatesService,
    MongooseModule.forFeature([{ name: Certificate.name, schema: CertificateSchema }]),
  ],
})
export class CertificatesModule {}
