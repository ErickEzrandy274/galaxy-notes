import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    userId: string;
    title: string;
    message: string;
    type?: string;
    noteId?: string;
  }) {
    return this.prisma.notification.create({ data });
  }
}
