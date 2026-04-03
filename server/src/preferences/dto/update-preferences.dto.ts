import { IsOptional, IsIn, IsEnum } from 'class-validator';
import { AutoDeleteBehavior } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePreferencesDto {
  @ApiPropertyOptional({
    example: 30,
    description: 'Days to retain trashed notes before auto-cleanup',
    enum: [7, 14, 30],
  })
  @IsOptional()
  @IsIn([7, 14, 30])
  trashRetentionDays?: number;

  @ApiPropertyOptional({
    example: 'delete_versions_only',
    description: 'Auto-delete behavior when trash retention expires',
    enum: ['delete_versions_only', 'delete_note_and_versions'],
  })
  @IsOptional()
  @IsEnum(AutoDeleteBehavior)
  autoDeleteBehavior?: AutoDeleteBehavior;
}
