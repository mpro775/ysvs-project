import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

@Injectable()
export class NewsletterMailService {
  private readonly logger = new Logger(NewsletterMailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('mail.host');
    const port = this.configService.get<number>('mail.port');
    const user = this.configService.get<string>('mail.user');
    const pass = this.configService.get<string>('mail.pass');

    if (!host || !port || !user || !pass) {
      this.logger.warn('Mail transport is not fully configured; newsletter emails are disabled');
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

  isConfigured(): boolean {
    return this.transporter !== null;
  }

  async sendConfirmationEmail(input: {
    to: string;
    confirmUrl: string;
  }): Promise<void> {
    if (!this.transporter) {
      throw new Error('Mail transport is not configured');
    }

    const from = this.configService.get<string>('mail.from') || 'noreply@ysvs.org';

    await this.transporter.sendMail({
      from,
      to: input.to,
      subject: 'تأكيد الاشتراك في النشرة البريدية',
      text: [
        'مرحباً،',
        '',
        'نشكرك على رغبتك في الاشتراك في النشرة البريدية للجمعية اليمنية لجراحة الأوعية الدموية.',
        'يرجى تأكيد اشتراكك عبر الرابط التالي:',
        input.confirmUrl,
        '',
        'إذا لم تقم بهذا الطلب، يمكنك تجاهل هذه الرسالة.',
      ].join('\n'),
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.7; color: #1f2937;">
          <p>مرحباً،</p>
          <p>نشكرك على رغبتك في الاشتراك في النشرة البريدية للجمعية اليمنية لجراحة الأوعية الدموية.</p>
          <p>
            <a href="${input.confirmUrl}" style="display:inline-block;padding:10px 18px;background:#0f766e;color:#fff;text-decoration:none;border-radius:6px;">
              تأكيد الاشتراك
            </a>
          </p>
          <p>إذا لم تقم بهذا الطلب، يمكنك تجاهل هذه الرسالة.</p>
        </div>
      `,
    });
  }
}
