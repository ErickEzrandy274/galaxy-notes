import { Injectable } from '@nestjs/common';
import { AppLogger } from '../../common/logger/app.logger';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '../notifications.service';
import {
  NOTIFICATION_SEND,
  NotificationPayload,
} from '../events/notification.events';

@Injectable()
export class NotificationListener {
  private readonly logger = new AppLogger(NotificationListener.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @OnEvent(NOTIFICATION_SEND, { async: true })
  async handleNotification(payload: NotificationPayload) {
    try {
      await this.notificationsService.create(payload);
    } catch (error) {
      this.logger.error(
        `Failed to send notification [${payload.type}] to user ${payload.userId}: ${error.message}`,
        error.stack,
      );
    }
  }
}
