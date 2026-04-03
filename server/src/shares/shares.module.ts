import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SharesService } from './shares.service';
import { SharesController } from './shares.controller';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [ConfigModule, MailModule],
  controllers: [SharesController],
  providers: [SharesService],
  exports: [SharesService],
})
export class SharesModule {}
