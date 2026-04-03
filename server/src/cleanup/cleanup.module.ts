import { Module } from '@nestjs/common';
import { NotesModule } from '../notes/notes.module';
import { PreferencesModule } from '../preferences/preferences.module';
import { CleanupService } from './cleanup.service';

@Module({
  imports: [NotesModule, PreferencesModule],
  providers: [CleanupService],
})
export class CleanupModule {}
