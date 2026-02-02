import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';
import { CertificateTemplate } from '../schemas/certificate-template.schema';

export interface CertificateData {
  serialNumber: string;
  recipientNameAr: string;
  recipientNameEn: string;
  eventTitleAr: string;
  eventTitleEn: string;
  cmeHours: number;
  issueDate: Date;
  eventDate: Date;
  verificationUrl: string;
}

@Injectable()
export class PdfGeneratorService {
  private readonly logger = new Logger(PdfGeneratorService.name);
  private readonly uploadPath: string;
  private readonly frontendUrl: string;

  constructor(private configService: ConfigService) {
    this.uploadPath = this.configService.get<string>('storage.uploadPath') || './uploads';
    this.frontendUrl = this.configService.get<string>('app.frontendUrl') || 'http://localhost:5173';

    // Ensure certificates directory exists
    const certsDir = path.join(this.uploadPath, 'certificates');
    if (!fs.existsSync(certsDir)) {
      fs.mkdirSync(certsDir, { recursive: true });
    }
  }

  async generateCertificatePdf(
    data: CertificateData,
    template?: CertificateTemplate,
  ): Promise<{ buffer: Buffer; filePath: string }> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: template?.pageSize || 'A4',
          layout: template?.orientation || 'landscape',
          margin: 0,
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve({ buffer, filePath: '' });
        });
        doc.on('error', reject);

        // Add background if template has one
        if (template?.backgroundImage) {
          try {
            const bgPath = path.join(this.uploadPath, template.backgroundImage);
            if (fs.existsSync(bgPath)) {
              doc.image(bgPath, 0, 0, {
                width: doc.page.width,
                height: doc.page.height,
              });
            }
          } catch (error) {
            this.logger.warn('Could not load background image');
          }
        }

        // Default layout if no template
        const layout = template?.layout || {
          namePosition: { x: 420, y: 280, fontSize: 28, align: 'center' as const },
          eventPosition: { x: 420, y: 340, fontSize: 20, align: 'center' as const },
          datePosition: { x: 420, y: 400, fontSize: 14, align: 'center' as const },
          qrPosition: { x: 680, y: 420 },
          serialPosition: { x: 420, y: 520, fontSize: 10, align: 'center' as const },
        };

        // Add recipient name (English)
        doc
          .fontSize(layout.namePosition.fontSize || 28)
          .fillColor(layout.namePosition.fontColor || '#000000')
          .text(
            data.recipientNameEn,
            layout.namePosition.x - 200,
            layout.namePosition.y,
            {
              width: 400,
              align: layout.namePosition.align || 'center',
            },
          );

        // Add event title (English)
        doc
          .fontSize(layout.eventPosition.fontSize || 20)
          .fillColor(layout.eventPosition.fontColor || '#333333')
          .text(
            data.eventTitleEn,
            layout.eventPosition.x - 200,
            layout.eventPosition.y,
            {
              width: 400,
              align: layout.eventPosition.align || 'center',
            },
          );

        // Add date
        const formattedDate = data.eventDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        doc
          .fontSize(layout.datePosition.fontSize || 14)
          .fillColor(layout.datePosition.fontColor || '#666666')
          .text(
            formattedDate,
            layout.datePosition.x - 100,
            layout.datePosition.y,
            {
              width: 200,
              align: layout.datePosition.align || 'center',
            },
          );

        // Add CME hours if available
        if (data.cmeHours > 0 && layout.cmeHoursPosition) {
          doc
            .fontSize(layout.cmeHoursPosition.fontSize || 14)
            .fillColor(layout.cmeHoursPosition.fontColor || '#333333')
            .text(
              `CME Hours: ${data.cmeHours}`,
              layout.cmeHoursPosition.x - 50,
              layout.cmeHoursPosition.y,
              {
                width: 100,
                align: layout.cmeHoursPosition.align || 'center',
              },
            );
        }

        // Generate and add QR code
        const qrCodeDataUrl = await QRCode.toDataURL(data.verificationUrl, {
          width: 80,
          margin: 1,
        });
        const qrCodeBuffer = Buffer.from(
          qrCodeDataUrl.replace(/^data:image\/png;base64,/, ''),
          'base64',
        );
        doc.image(qrCodeBuffer, layout.qrPosition.x, layout.qrPosition.y, {
          width: 80,
          height: 80,
        });

        // Add serial number
        doc
          .fontSize(layout.serialPosition.fontSize || 10)
          .fillColor(layout.serialPosition.fontColor || '#999999')
          .text(
            `Certificate No: ${data.serialNumber}`,
            layout.serialPosition.x - 100,
            layout.serialPosition.y,
            {
              width: 200,
              align: layout.serialPosition.align || 'center',
            },
          );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  async saveCertificatePdf(
    buffer: Buffer,
    serialNumber: string,
  ): Promise<string> {
    const filename = `${serialNumber}.pdf`;
    const filePath = path.join(this.uploadPath, 'certificates', filename);

    await fs.promises.writeFile(filePath, buffer);
    this.logger.log(`Certificate saved: ${filename}`);

    return `/certificates/${filename}`;
  }

  generateVerificationUrl(serialNumber: string): string {
    return `${this.frontendUrl}/verify/${serialNumber}`;
  }
}
