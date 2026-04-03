import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotesService } from './notes.service';
import { NotesController } from './notes.controller';
import { PreferencesModule } from '../preferences/preferences.module';

@Module({
  imports: [ConfigModule, PreferencesModule],
  controllers: [NotesController],
  providers: [NotesService],
  exports: [NotesService],
})
export class NotesModule {}
