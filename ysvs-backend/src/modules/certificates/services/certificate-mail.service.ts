import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

@Injectable()
export class CertificateMailService {
  private readonly logger = new Logger(CertificateMailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('mail.host');
    const port = this.configService.get<number>('mail.port');
    const user = this.configService.get<string>('mail.user');
    const pass = this.configService.get<string>('mail.pass');

    if (!host || !port || !user || !pass) {
      this.logger.warn('Mail transport is not fully configured; guest emails are disabled');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });
  }

  async sendGuestCertificateEmail(input: {
    to: string;
    recipientNameAr: string;
    recipientNameEn: string;
    eventTitleAr: string;
    serialNumber: string;
    downloadUrl: string;
  }): Promise<void> {
    if (!this.transporter) {
      throw new Error('Mail transport is not configured');
    }

    const from = this.configService.get<string>('mail.from') || 'noreply@ysvs.org';

    await this.transporter.sendMail({
      from,
      to: input.to,
      subject: `شهادة حضور المؤتمر - ${input.eventTitleAr}`,
      text: [
        `مرحباً ${input.recipientNameAr || input.recipientNameEn || 'ضيفنا الكريم'},`,
        '',
        `تم إصدار شهادتك للمؤتمر: ${input.eventTitleAr}.`,
        `رقم الشهادة: ${input.serialNumber}`,
        '',
        `رابط تحميل الشهادة (صالح لفترة محدودة):`,
        input.downloadUrl,
        '',
        'مع التحية،',
        'فريق YSVS',
      ].join('\n'),
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.7; color: #1f2937;">
          <p>مرحباً ${input.recipientNameAr || input.recipientNameEn || 'ضيفنا الكريم'}،</p>
          <p>تم إصدار شهادتك للمؤتمر: <strong>${input.eventTitleAr}</strong>.</p>
          <p>رقم الشهادة: <strong>${input.serialNumber}</strong></p>
          <p>
            <a href="${input.downloadUrl}" style="display:inline-block;padding:10px 18px;background:#0f766e;color:#fff;text-decoration:none;border-radius:6px;">
              تحميل الشهادة
            </a>
          </p>
          <p>هذا الرابط صالح لفترة محدودة.</p>
          <p>مع التحية،<br/>فريق YSVS</p>
        </div>
      `,
    });
  }
}
