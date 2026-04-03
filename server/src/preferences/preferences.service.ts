import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

const DEFAULTS = {
  trashRetentionDays: 30,
  autoDeleteBehavior: 'delete_versions_only' as const,
};

@Injectable()
export class PreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  async getPreferences(userId: string) {
    const pref = await this.prisma.userPreference.findUnique({
      where: { userId },
      select: { trashRetentionDays: true, autoDeleteBehavior: true },
    });

    if (!pref) {
      return {
        trashRetentionDays: DEFAULTS.trashRetentionDays,
        autoDeleteBehavior: DEFAULTS.autoDeleteBehavior,
      };
    }

    return {
      trashRetentionDays: pref.trashRetentionDays,
      autoDeleteBehavior: pref.autoDeleteBehavior,
    };
  }

  async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    const pref = await this.prisma.userPreference.upsert({
      where: { userId },
      create: {
        userId,
        trashRetentionDays: dto.trashRetentionDays ?? DEFAULTS.trashRetentionDays,
        autoDeleteBehavior: dto.autoDeleteBehavior ?? DEFAULTS.autoDeleteBehavior,
      },
      update: {
        ...(dto.trashRetentionDays !== undefined && {
          trashRetentionDays: dto.trashRetentionDays,
        }),
        ...(dto.autoDeleteBehavior !== undefined && {
          autoDeleteBehavior: dto.autoDeleteBehavior,
        }),
      },
    });

    return {
      trashRetentionDays: pref.trashRetentionDays,
      autoDeleteBehavior: pref.autoDeleteBehavior,
    };
  }
}
