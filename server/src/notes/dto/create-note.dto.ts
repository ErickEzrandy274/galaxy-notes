import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNoteDto {
  @ApiProperty({ example: 'My First Note', description: 'Note title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Note HTML content' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ example: 'draft', description: 'Note status', enum: ['draft', 'published'] })
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

  @ApiPropertyOptional({ description: 'Storage path for attached document' })
  @IsOptional()
  @IsString()
  document?: string;
}
