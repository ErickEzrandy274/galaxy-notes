import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { NotesModule } from '../notes/notes.module';
import { PreferencesModule } from '../preferences/preferences.module';
import { CleanupService } from './cleanup.service';

@Module({
  imports: [NotificationsModule, NotesModule, PreferencesModule],
  providers: [CleanupService],
})
export class CleanupModule {}
