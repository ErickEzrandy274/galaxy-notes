export const NOTIFICATION_SEND = 'notification.send';

export class NotificationPayload {
  userId: string;
  title: string;
  message: string;
  type?: string;
  noteId?: string;
  actorId?: string;
}
