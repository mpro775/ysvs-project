import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

@Injectable()
export class ContactMailService {
  private readonly logger = new Logger(ContactMailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('mail.host');
    const port = this.configService.get<number>('mail.port');
    const user = this.configService.get<string>('mail.user');
    const pass = this.configService.get<string>('mail.pass');

    if (!host || !port || !user || !pass) {
      this.logger.warn('Mail transport is not fully configured; contact emails are disabled');
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

  async sendContactNotification(input: {
    to: string;
    messageId: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    createdAt: Date;
  }): Promise<void> {
    if (!this.transporter) {
      throw new Error('Mail transport is not configured');
    }

    const from = this.configService.get<string>('mail.from') || 'noreply@ysvs.org';

    await this.transporter.sendMail({
      from,
      to: input.to,
      subject: `رسالة تواصل جديدة: ${input.subject}`,
      text: [
        'تم استلام رسالة جديدة من نموذج تواصل معنا.',
        '',
        `الاسم: ${input.name}`,
        `البريد الإلكتروني: ${input.email}`,
        `الموضوع: ${input.subject}`,
        `وقت الإرسال: ${input.createdAt.toISOString()}`,
        `رقم الرسالة: ${input.messageId}`,
        '',
        'نص الرسالة:',
        input.message,
      ].join('\n'),
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.7; color: #1f2937;">
          <h3 style="margin: 0 0 12px;">رسالة تواصل جديدة</h3>
          <p><strong>الاسم:</strong> ${input.name}</p>
          <p><strong>البريد الإلكتروني:</strong> ${input.email}</p>
          <p><strong>الموضوع:</strong> ${input.subject}</p>
          <p><strong>وقت الإرسال:</strong> ${input.createdAt.toISOString()}</p>
          <p><strong>رقم الرسالة:</strong> ${input.messageId}</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:12px 0;" />
          <p style="white-space: pre-line;">${this.escapeHtml(input.message)}</p>
        </div>
      `,
    });
  }

  async sendReplyEmail(input: {
    to: string;
    name: string;
    subject: string;
    body: string;
  }): Promise<void> {
    if (!this.transporter) {
      throw new Error('Mail transport is not configured');
    }

    const from = this.configService.get<string>('mail.from') || 'noreply@ysvs.org';

    await this.transporter.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      text: [
        `مرحباً ${input.name}،`,
        '',
        input.body,
        '',
        'مع التحية،',
        'فريق الجمعية اليمنية لجراحة الأوعية الدموية',
      ].join('\n'),
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.8; color: #1f2937;">
          <p>مرحباً ${this.escapeHtml(input.name)}،</p>
          <p style="white-space: pre-line;">${this.escapeHtml(input.body)}</p>
          <p>مع التحية،<br/>فريق الجمعية اليمنية لجراحة الأوعية الدموية</p>
        </div>
      `,
    });
  }

  async sendAutoAckEmail(input: {
    to: string;
    name: string;
    subject: string;
  }): Promise<void> {
    if (!this.transporter) {
      throw new Error('Mail transport is not configured');
    }

    const from = this.configService.get<string>('mail.from') || 'noreply@ysvs.org';

    await this.transporter.sendMail({
      from,
      to: input.to,
      subject: `تم استلام رسالتكم: ${input.subject}`,
      text: [
        `مرحباً ${input.name}،`,
        '',
        'شكراً لتواصلكم معنا. تم استلام رسالتكم وسيتم الرد عليكم في أقرب وقت ممكن.',
        '',
        'مع التحية،',
        'فريق الجمعية اليمنية لجراحة الأوعية الدموية',
      ].join('\n'),
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.8; color: #1f2937;">
          <p>مرحباً ${this.escapeHtml(input.name)}،</p>
          <p>شكراً لتواصلكم معنا. تم استلام رسالتكم وسيتم الرد عليكم في أقرب وقت ممكن.</p>
          <p>مع التحية،<br/>فريق الجمعية اليمنية لجراحة الأوعية الدموية</p>
        </div>
      `,
    });
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
