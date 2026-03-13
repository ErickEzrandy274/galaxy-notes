import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { CleanupService } from './cleanup.service';

@Module({
  imports: [NotificationsModule],
  providers: [CleanupService],
})
export class CleanupModule {}
