import { IsString, IsNumber, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSignedUploadUrlDto {
  @ApiProperty({ description: 'ID of the note to upload to' })
  @IsString()
  noteId: string;

  @ApiProperty({ example: 'image.png', description: 'Original file name' })
  @IsString()
  fileName: string;

  @ApiProperty({ example: 'image/png', description: 'MIME type of the file' })
  @IsString()
  mimeType: string;

  @ApiProperty({ example: 512000, description: 'File size in bytes' })
  @IsNumber()
  fileSize: number;

  @ApiProperty({
    example: 'rich-text-editor',
    description: 'Upload source context',
    enum: ['rich-text-editor', 'attachment'],
  })
  @IsString()
  @IsIn(['rich-text-editor', 'attachment'])
  source: 'rich-text-editor' | 'attachment';
}
