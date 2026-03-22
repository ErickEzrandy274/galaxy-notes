import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SharesService } from './shares.service';
import { SharesController } from './shares.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [ConfigModule, NotificationsModule, UsersModule, MailModule],
  controllers: [SharesController],
  providers: [SharesService],
  exports: [SharesService],
})
export class SharesModule {}
