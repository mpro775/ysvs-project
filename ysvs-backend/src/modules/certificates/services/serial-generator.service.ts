import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Certificate, CertificateDocument } from '../schemas/certificate.schema';

@Injectable()
export class SerialGeneratorService {
  constructor(
    @InjectModel(Certificate.name)
    private certificateModel: Model<CertificateDocument>,
  ) {}

  async generateSerialNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `YSVS-${year}`;

    // Get the last serial number for this year
    const lastCertificate = await this.certificateModel
      .findOne({
        serialNumber: { $regex: `^${prefix}` },
      })
      .sort({ serialNumber: -1 })
      .exec();

    let nextNumber = 1;

    if (lastCertificate) {
      const lastSerial = lastCertificate.serialNumber;
      const lastNumberStr = lastSerial.split('-')[2];
      nextNumber = parseInt(lastNumberStr, 10) + 1;
    }

    // Pad with zeros (5 digits)
    const paddedNumber = nextNumber.toString().padStart(5, '0');
    return `${prefix}-${paddedNumber}`;
  }

  async generateBulkSerialNumbers(count: number): Promise<string[]> {
    const serials: string[] = [];
    const year = new Date().getFullYear();
    const prefix = `YSVS-${year}`;

    // Get the last serial number for this year
    const lastCertificate = await this.certificateModel
      .findOne({
        serialNumber: { $regex: `^${prefix}` },
      })
      .sort({ serialNumber: -1 })
      .exec();

    let nextNumber = 1;

    if (lastCertificate) {
      const lastSerial = lastCertificate.serialNumber;
      const lastNumberStr = lastSerial.split('-')[2];
      nextNumber = parseInt(lastNumberStr, 10) + 1;
    }

    for (let i = 0; i < count; i++) {
      const paddedNumber = (nextNumber + i).toString().padStart(5, '0');
      serials.push(`${prefix}-${paddedNumber}`);
    }

    return serials;
  }
}
