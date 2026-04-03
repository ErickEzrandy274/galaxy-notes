import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateNoteDto {
  @ApiPropertyOptional({ example: 'Updated Title', description: 'Note title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Note HTML content' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ example: 'published', description: 'Note status', enum: ['draft', 'published'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: ['react', 'typescript'], description: 'Tags for the note' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: 'https://youtube.com/watch?v=...', description: 'Embedded video URL' })
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiPropertyOptional({ description: 'Storage path for attached document (null to remove)', nullable: true })
  @IsOptional()
  @IsString()
  document?: string | null;

  @ApiPropertyOptional({ example: 512000, description: 'Document file size in bytes', nullable: true })
  @IsOptional()
  @IsNumber()
  documentSize?: number | null;

  @ApiProperty({ example: 1, description: 'Current note version for optimistic locking' })
  @IsNumber()
  version: number;

  @ApiPropertyOptional({ description: 'Whether to create a version snapshot (manual save)' })
  @IsOptional()
  @IsBoolean()
  snapshot?: boolean;
}
