import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CertificatesService } from './certificates.service';
import { CertificatesController } from './certificates.controller';
import { PdfGeneratorService } from './services/pdf-generator.service';
import { SerialGeneratorService } from './services/serial-generator.service';
import { Certificate, CertificateSchema } from './schemas/certificate.schema';
import {
  CertificateTemplate,
  CertificateTemplateSchema,
} from './schemas/certificate-template.schema';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Certificate.name, schema: CertificateSchema },
      { name: CertificateTemplate.name, schema: CertificateTemplateSchema },
    ]),
    EventsModule,
  ],
  controllers: [CertificatesController],
  providers: [CertificatesService, PdfGeneratorService, SerialGeneratorService],
  exports: [
    CertificatesService,
    MongooseModule.forFeature([{ name: Certificate.name, schema: CertificateSchema }]),
  ],
})
export class CertificatesModule {}
