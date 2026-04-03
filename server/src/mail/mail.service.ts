import { Injectable } from '@nestjs/common';
import { AppLogger } from '../common/logger/app.logger';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';
import { passwordResetTemplate } from './templates/password-reset.template';
import {
  shareInviteTemplate,
  formatTimeAgo,
} from './templates/share-invite.template';

@Injectable()
export class MailService {
  private readonly transporter: Transporter;
  private readonly fromAddress: string;
  private readonly logger = new AppLogger(MailService.name);

  constructor(private readonly configService: ConfigService) {
    this.fromAddress =
      this.configService.get<string>('MAIL_FROM') ||
      `Galaxy Notes <${this.configService.get<string>('SMTP_USER')}>`;

    this.transporter = createTransport({
      host: this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: false,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject: 'Reset your Galaxy Notes password',
        html: passwordResetTemplate({ email: to, resetUrl }),
      });

      this.logger.log(`Password reset email sent to ${to}`);
      return true;
    } catch (err) {
      this.logger.error(`Failed to send reset email to ${to}`, err);
      return false;
    }
  }

  async sendShareInviteEmail(
    to: string,
    data: {
      sharerName: string;
      noteTitle: string;
      noteUpdatedAt: Date;
      token: string;
    },
  ): Promise<boolean> {
    try {
      const clientUrl = this.configService.get<string>('CLIENT_URL');
      const registerUrl = `${clientUrl}/register?email=${encodeURIComponent(to)}&invite=${data.token}`;

      await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject: `${data.sharerName} shared a note with you on Galaxy Notes`,
        html: shareInviteTemplate({
          sharerName: data.sharerName,
          noteTitle: data.noteTitle,
          lastEditedAgo: formatTimeAgo(data.noteUpdatedAt),
          registerUrl,
        }),
      });

      this.logger.log(`Share invite email sent to ${to}`);
      return true;
    } catch (err) {
      this.logger.error(`Failed to send share invite email to ${to}`, err);
      return false;
    }
  }
}
