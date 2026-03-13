import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotesService } from './notes.service';
import { NotesController } from './notes.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [ConfigModule, NotificationsModule],
  controllers: [NotesController],
  providers: [NotesService],
  exports: [NotesService],
})
export class NotesModule {}
